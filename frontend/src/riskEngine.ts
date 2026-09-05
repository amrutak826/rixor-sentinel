import { TransactionRecord, RiskBand, RecommendedAction, RiskSignal } from './types';
import { USD_TO_INR } from './data/mockRiskData';

export interface IncomingTransactionPayload {
  transaction_id: string;
  customer_id: string;
  merchant_id?: string;
  amount: number;
  currency: string;
  device_id?: string;
  ip_address?: string;
  payment_instrument_id?: string;
  timestamp: string;
}

export interface IngestionValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates incoming transaction payload against required schema:
 * - transaction_id (string, non-empty)
 * - customer_id (string, non-empty)
 * - amount (positive number)
 * - currency (string, non-empty)
 * - timestamp (valid ISO or date string)
 */
export function validateTransactionPayload(payload: unknown): IngestionValidationResult {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Request body must be a valid JSON object'] };
  }

  const p = payload as Record<string, unknown>;

  if (!p.transaction_id || typeof p.transaction_id !== 'string' || p.transaction_id.trim() === '') {
    errors.push('Field "transaction_id" is required and must be a non-empty string');
  }

  if (!p.customer_id || typeof p.customer_id !== 'string' || p.customer_id.trim() === '') {
    errors.push('Field "customer_id" is required and must be a non-empty string');
  }

  if (typeof p.amount !== 'number' || isNaN(p.amount) || p.amount <= 0) {
    errors.push('Field "amount" is required and must be a positive number');
  }

  if (!p.currency || typeof p.currency !== 'string' || p.currency.trim() === '') {
    errors.push('Field "currency" is required and must be a non-empty string');
  }

  if (!p.timestamp || typeof p.timestamp !== 'string') {
    errors.push('Field "timestamp" is required and must be a valid ISO-8601 date string');
  } else {
    const parsedDate = new Date(p.timestamp);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Field "timestamp" is not a valid date string');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Normalizes incoming transaction payload and runs Rixor's Graph and Rule Risk Analysis
 */
export function evaluateTransactionRisk(
  raw: IncomingTransactionPayload,
  policy = { blockThreshold: 0.88, holdThreshold: 0.75, reviewThreshold: 0.55 }
): TransactionRecord {
  // Normalize amount to INR if given in USD or foreign currency
  const isUSD = raw.currency.toUpperCase() === 'USD';
  const amountINR = isUSD ? Math.round(raw.amount * USD_TO_INR) : Math.round(raw.amount);

  // Normalize timestamp
  let formattedTimestamp = raw.timestamp;
  try {
    const d = new Date(raw.timestamp);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  } catch {
    // Keep raw timestamp fallback
  }

  const deviceId = raw.device_id || 'Device-Unknown';
  const ipId = raw.ip_address || 'IP-Unknown';
  const instrumentId = raw.payment_instrument_id || 'Instrument-Unknown';
  const customerId = raw.customer_id;
  const merchantId = raw.merchant_id || 'M-GEN-01';

  // Compute Merchant Display Name
  const merchantName = raw.merchant_id 
    ? (raw.merchant_id.startsWith('MERCHANT_22') ? 'QuickPerks GiftCards India' : `Merchant ${raw.merchant_id}`)
    : 'QuickPerks GiftCards India';

  // Rixor Graph Intelligence & Signal Calculation
  let baseScore = 0.12;
  const evidence: RiskSignal[] = [];
  let isRing017Member = false;

  // 1. Hardware Sybil / Device Fingerprint check
  if (
    deviceId === 'Device-17' || 
    deviceId === 'DEV_77' || 
    deviceId.toLowerCase().includes('device-17') ||
    deviceId === 'Device-22' ||
    deviceId === 'Device-31'
  ) {
    baseScore += 0.42;
    isRing017Member = true;
    evidence.push({
      signal: 'GRAPH_HARDWARE_SYBIL',
      value: `${deviceId} collision`,
      contribution: 0.42,
      severity: 'critical',
      explanation: `Device fingerprint ${deviceId} matched multi-account hardware cluster in Ring-017 (WebGL canvas hash collision).`,
    });
  } else if (deviceId.toLowerCase().includes('emulator') || deviceId === 'Device-09') {
    baseScore += 0.32;
    evidence.push({
      signal: 'EMULATOR_ENVIRONMENT',
      value: deviceId,
      contribution: 0.32,
      severity: 'high',
      explanation: 'Headless / emulator container signature detected during client handshake.',
    });
  }

  // 2. Virtual PAN & Payment Instrument Recycling
  if (
    instrumentId === 'Instrument-4' || 
    instrumentId === 'Instrument-5' ||
    instrumentId === 'CARD_TOKEN_12' ||
    instrumentId.toLowerCase().includes('token_12') ||
    instrumentId.toLowerCase().includes('disposable')
  ) {
    baseScore += 0.28;
    isRing017Member = true;
    evidence.push({
      signal: 'RECYCLED_VIRTUAL_PAN',
      value: instrumentId,
      contribution: 0.28,
      severity: 'critical',
      explanation: `Payment instrument token ${instrumentId} recycled across multiple distinct customer identities within 48 hours.`,
    });
  }

  // 3. Tor / Datacenter VPN / Proxy Ingress
  if (
    ipId === 'IP-07' || 
    ipId === 'IP-08' || 
    ipId.startsWith('103.21.') ||
    ipId.startsWith('198.51.') ||
    ipId.startsWith('203.0.') ||
    ipId.toLowerCase().includes('tor')
  ) {
    baseScore += 0.22;
    evidence.push({
      signal: 'ANONYMOUS_PROXY_INGRESS',
      value: ipId,
      contribution: 0.22,
      severity: 'high',
      explanation: `Transaction routed via anonymous proxy/Tor node or high-risk datacenter subnet (${ipId}).`,
    });
  }

  // 4. Sub-₹50,000 KYC Structuring Pattern
  if (amountINR >= 24000 && amountINR <= 49999) {
    baseScore += 0.16;
    evidence.push({
      signal: 'KYC_STRUCTURING_PATTERN',
      value: `₹${amountINR.toLocaleString('en-IN')}`,
      contribution: 0.16,
      severity: 'medium',
      explanation: `Transaction amount deliberately structured just below regulatory reporting thresholds.`,
    });
  }

  // 5. Customer identity cluster overlap
  if (
    customerId.toUpperCase().startsWith('CUS_101') ||
    customerId.toUpperCase() === 'C101' ||
    customerId.toUpperCase() === 'C102' ||
    customerId.toUpperCase() === 'C107' ||
    customerId.toUpperCase() === 'C114'
  ) {
    baseScore += 0.24;
    isRing017Member = true;
    evidence.push({
      signal: 'KNOWN_SYNDICATE_ENTITY',
      value: customerId,
      contribution: 0.24,
      severity: 'critical',
      explanation: `Customer account ${customerId} has direct graph co-dependencies within active syndicate Ring-017.`,
    });
  }

  // If no negative signals were triggered, add baseline signal
  if (evidence.length === 0) {
    evidence.push({
      signal: 'STANDARD_MERCHANT_FLOW',
      value: 'Clean ingress metrics',
      contribution: 0.05,
      severity: 'low',
      explanation: 'No known device collisions or proxy flags detected for this payload.',
    });
  }

  // Final score clamping
  const riskScore = Math.min(0.99, Math.max(0.06, Math.round(baseScore * 100) / 100));

  // Determine Band & Action based on policy thresholds
  let riskBand: RiskBand = 'LOW';
  let action: RecommendedAction = 'ALLOW';
  let status: 'ALLOWED' | 'REVIEW' | 'HELD' | 'BLOCKED' = 'ALLOWED';

  if (riskScore >= policy.blockThreshold) {
    riskBand = 'CRITICAL';
    action = 'BLOCK';
    status = 'BLOCKED';
  } else if (riskScore >= policy.holdThreshold) {
    riskBand = 'CRITICAL';
    action = 'HOLD';
    status = 'HELD';
  } else if (riskScore >= policy.reviewThreshold) {
    riskBand = 'HIGH';
    action = 'REVIEW';
    status = 'REVIEW';
  } else if (riskScore >= 0.40) {
    riskBand = 'MEDIUM';
    action = 'MONITOR';
    status = 'ALLOWED';
  } else {
    riskBand = 'LOW';
    action = 'ALLOW';
    status = 'ALLOWED';
  }

  return {
    id: raw.transaction_id,
    customerId,
    merchantId,
    merchantName,
    amount: amountINR,
    timestamp: formattedTimestamp,
    deviceId,
    ipId,
    addressId: isRing017Member ? 'Address-12' : 'Address-Unlinked',
    instrumentId,
    status,
    riskScore,
    riskBand,
    action,
    ringId: isRing017Member ? 'RING-017' : undefined,
    evidence,
  };
}
