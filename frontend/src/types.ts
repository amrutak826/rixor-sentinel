export type EntityType = 
  | 'customer' 
  | 'device' 
  | 'ip' 
  | 'address' 
  | 'payment_instrument' 
  | 'merchant' 
  | 'transaction';

export type RiskBand = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RecommendedAction = 'ALLOW' | 'MONITOR' | 'REVIEW' | 'HOLD' | 'BLOCK';
export type CaseStatus = 'NEW' | 'TRIAGED' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'FALSE_POSITIVE';
export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  riskScore: number;
  isFlagged?: boolean;
  metadata?: Record<string, string | number>;
  x?: number;
  y?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight: number;
  firstSeen: string;
  lastSeen: string;
}

export interface RiskSignal {
  signal: string;
  value: string | number;
  contribution: number; // e.g. +0.34
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
}

export interface TransactionRecord {
  id: string;
  customerId: string;
  merchantId: string;
  merchantName: string;
  amount: number;
  timestamp: string;
  deviceId: string;
  ipId: string;
  addressId: string;
  instrumentId: string;
  status: 'PENDING' | 'ALLOWED' | 'REVIEW' | 'HELD' | 'BLOCKED';
  riskScore: number;
  riskBand: RiskBand;
  action: RecommendedAction;
  ringId?: string;
  evidence: RiskSignal[];
}

export interface RiskCase {
  id: string;
  title: string;
  customerIds: string[];
  priority: CasePriority;
  status: CaseStatus;
  ringId: string;
  assignedAnalyst: string;
  createdAt: string;
  openedAt: string;
  updatedAt: string;
  totalTransactions: number;
  totalVolume: number; // In ₹
  suspiciousEntitiesCount: number;
  suspectedPattern: string;
  timeline: {
    timestamp: string;
    title: string;
    description: string;
    actor?: string;
  }[];
  linkedEntities: {
    type: EntityType;
    id: string;
    label: string;
    riskScore: number;
  }[];
  aiSummary?: {
    riskSummary: string;
    strongestEvidence: string[];
    suspectedCoordinationPattern: string;
    analystQuestions: string[];
    recommendedNextStep: string;
    uncertaintyNotes: string;
  };
  notes: string[];
  decision?: {
    action: RecommendedAction;
    policyVersion: string;
    modelVersion: string;
    decidedBy: string;
    decidedAt: string;
    reason: string;
  };
}

export interface PolicyConfig {
  id: string;
  version: string;
  name: string;
  active: boolean;
  reviewThreshold: number; // 0.70
  holdThreshold: number;   // 0.85
  blockThreshold: number;  // 0.90
  weights: {
    ml: number;       // 0.40
    graph: number;    // 0.35
    behaviour: number;// 0.15
    rules: number;    // 0.10
  };
  rules: {
    maxCustomersPerDevice: number;
    maxVelocityPerHour: number;
    amountSimilarityThreshold: number;
  };
}

export interface EvaluationRunMetrics {
  runId: string;
  modelVersion: string;
  featureVersion: string;
  datasetVersion: string;
  heldOutRings: string;
  precision: number;
  recall: number;
  f1: number;
  fpCount: number;
  fnCount: number;
  tpCount: number;
  tnCount: number;
  estimatedLossAvoided: number;
  reviewCost: number;
  netCostEfficiency: number;
  baseline: {
    name: string;
    precision: number;
    recall: number;
    f1: number;
    fpCount: number;
    fnCount: number;
  };
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  eventType: string;
  entityType: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, any>;
}
