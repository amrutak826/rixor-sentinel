import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { 
  validateTransactionPayload, 
  evaluateTransactionRisk, 
  IncomingTransactionPayload 
} from './src/riskEngine';
import { TransactionRecord } from './src/types';

// Load environment variables from .env if present
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON bodies
app.use(express.json({ limit: '2mb' }));

// In-memory transaction storage & idempotency cache
const processedTransactions = new Map<string, TransactionRecord>();
const recentTransactionsBuffer: TransactionRecord[] = [];
const MAX_RECENT_BUFFER = 100;

// SSE connected clients for real-time live dashboard sync
const sseClients = new Set<Response>();

function broadcastNewTransaction(tx: TransactionRecord) {
  const data = JSON.stringify(tx);
  for (const client of sseClients) {
    try {
      client.write(`data: ${data}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

// -----------------------------------------------------------------------------
// 1. HEALTH ENDPOINT
// -----------------------------------------------------------------------------
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'rixor-api',
  });
});

// -----------------------------------------------------------------------------
// 2. WEBHOOK INGESTION ENDPOINT: POST /api/transactions/ingest
// -----------------------------------------------------------------------------
app.post('/api/transactions/ingest', (req: Request, res: Response) => {
  const webhookSecret = process.env.WEBHOOK_SECRET;

  // Webhook Authentication:
  // Validate token from either 'X-Webhook-Secret' or 'Authorization: Bearer <token>'
  const authHeader = req.headers['x-webhook-secret'] || req.headers['authorization'];
  let providedToken = '';
  if (typeof authHeader === 'string') {
    providedToken = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7).trim() 
      : authHeader.trim();
  }

  // Reject unauthorized requests if secret is configured or if caller sends an incorrect secret
  if (webhookSecret && webhookSecret.trim() !== '') {
    if (!providedToken || providedToken !== webhookSecret.trim()) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or missing webhook secret. Provide your secret in the X-Webhook-Secret header.',
      });
    }
  } else if (!providedToken) {
    // Log notice when server-side secret is not configured in settings yet
    console.warn('[Rixor Webhook] WEBHOOK_SECRET is not configured in server environment. Please set it in Settings.');
  }

  const payload = req.body;

  // Payload Schema Validation
  const validation = validateTransactionPayload(payload);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid transaction payload',
      details: validation.errors,
    });
  }

  const incoming = payload as IncomingTransactionPayload;

  // Idempotency: Reject duplicate transactions
  if (processedTransactions.has(incoming.transaction_id)) {
    return res.status(409).json({
      error: 'Conflict: Duplicate transaction_id already processed',
      transaction_id: incoming.transaction_id,
      existing_transaction: processedTransactions.get(incoming.transaction_id),
    });
  }

  try {
    // Evaluate risk using Rixor's Graph Intelligence and Policy Engine
    const evaluatedTx = evaluateTransactionRisk(incoming);

    // Store transaction in idempotency set and recent buffer
    processedTransactions.set(incoming.transaction_id, evaluatedTx);
    recentTransactionsBuffer.unshift(evaluatedTx);
    if (recentTransactionsBuffer.length > MAX_RECENT_BUFFER) {
      recentTransactionsBuffer.pop();
    }

    // Broadcast to active connected Rixor dashboards in real time
    broadcastNewTransaction(evaluatedTx);

    return res.status(200).json({
      status: 'success',
      message: 'Transaction ingested and risk evaluated successfully',
      transaction: evaluatedTx,
      risk_evaluation: {
        risk_score: evaluatedTx.riskScore,
        risk_band: evaluatedTx.riskBand,
        recommended_action: evaluatedTx.action,
        ring_id: evaluatedTx.ringId || null,
        signals_detected: evaluatedTx.evidence.length,
      },
    });
  } catch (err: unknown) {
    console.error('[Rixor Webhook Error]:', err);
    return res.status(500).json({
      error: 'Internal risk evaluation error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

// -----------------------------------------------------------------------------
// 3. RECENT INGESTED TRANSACTIONS QUERY: GET /api/transactions
// -----------------------------------------------------------------------------
app.get('/api/transactions', (req: Request, res: Response) => {
  res.status(200).json({
    count: recentTransactionsBuffer.length,
    transactions: recentTransactionsBuffer,
  });
});

// -----------------------------------------------------------------------------
// 4. REAL-TIME SSE STREAM FOR CLIENT DASHBOARDS: GET /api/transactions/stream
// -----------------------------------------------------------------------------
app.get('/api/transactions/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// -----------------------------------------------------------------------------
// 5. DEVELOPER-SAFE TEST PROXY: POST /api/transactions/test-simulate
// Allows UI testing without exposing WEBHOOK_SECRET to client-side code
// -----------------------------------------------------------------------------
app.post('/api/transactions/test-simulate', (req: Request, res: Response) => {
  const payload = req.body;
  const validation = validateTransactionPayload(payload);
  if (!validation.valid) {
    return res.status(400).json({
      error: 'Invalid test payload',
      details: validation.errors,
    });
  }

  const incoming = payload as IncomingTransactionPayload;
  if (processedTransactions.has(incoming.transaction_id)) {
    return res.status(409).json({
      error: 'Duplicate transaction_id already processed',
      transaction_id: incoming.transaction_id,
    });
  }

  const evaluatedTx = evaluateTransactionRisk(incoming);
  processedTransactions.set(incoming.transaction_id, evaluatedTx);
  recentTransactionsBuffer.unshift(evaluatedTx);
  if (recentTransactionsBuffer.length > MAX_RECENT_BUFFER) {
    recentTransactionsBuffer.pop();
  }

  broadcastNewTransaction(evaluatedTx);

  return res.status(200).json({
    status: 'success',
    mode: 'developer_test_simulation',
    transaction: evaluatedTx,
  });
});

// -----------------------------------------------------------------------------
// 6. VITE & STATIC SPA MIDDLEWARE
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Rixor Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Rixor Server] Webhook endpoint available at POST /api/transactions/ingest`);
    console.log(`[Rixor Server] Health endpoint available at GET /api/health`);
  });
}

startServer();
