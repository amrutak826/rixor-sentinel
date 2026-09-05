import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  GraphNode, 
  RiskCase, 
  PolicyConfig, 
  RecommendedAction,
  TransactionRecord 
} from '../types';
import { 
  INITIAL_RING_017_NODES, 
  INITIAL_RING_017_EDGES, 
  MOCK_TRANSACTIONS, 
  MOCK_CASES, 
  ACTIVE_POLICY, 
  EVALUATION_DATA, 
  INITIAL_AUDIT_TRAIL 
} from '../data/mockRiskData';
import { RixorLogo } from './VaultShieldLogo';
import { OverviewPage } from './pages/OverviewPage';
import { RingGraphView } from './RingGraphView';
import { CasesPage } from './pages/CasesPage';
import { EvaluationPage } from './pages/EvaluationPage';
import { PolicyPage } from './pages/PolicyPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { ToastNotificationContainer, HighPriorityToast } from './ToastNotification';
import { FirebaseAuthBar } from './FirebaseAuthBar';
import { InfoTooltip } from './InfoTooltip';
import { User } from 'firebase/auth';
import { 
  saveUserCaseDecisionToFirestore, 
  loadUserCasesFromFirestore, 
  saveUserPolicyToFirestore, 
  loadUserPolicyFromFirestore 
} from '../firebase';
import { 
  LayoutDashboard, 
  Network, 
  FolderLock, 
  BarChart3, 
  Sliders, 
  ArrowLeft, 
  Bell, 
  ShieldCheck, 
  CheckCircle2,
  Zap,
  Radio,
  BookOpen
} from 'lucide-react';

export type AppPage = 'overview' | 'ring-explorer' | 'cases' | 'evaluation' | 'policy' | 'docs';

interface SentinelConsoleProps {
  initialPage?: AppPage;
  onBackToHero: () => void;
  currentUser?: User | null;
  isAuthLoading?: boolean;
}

// Pool of realistic high-risk events to stream periodically
const SIMULATED_ATTACK_POOL = [
  {
    customerId: 'C114',
    merchantName: 'QuickPerks GiftCards India',
    amount: 47820,
    riskScore: 0.97,
    status: 'BLOCKED' as const,
    riskBand: 'CRITICAL' as const,
    signal: 'Device-17 WebGL canvas hash collision across 14 accounts in Ring-017',
  },
  {
    customerId: 'C107',
    merchantName: 'Nova Crypto Remit Gateway',
    amount: 48950,
    riskScore: 0.95,
    status: 'BLOCKED' as const,
    riskBand: 'CRITICAL' as const,
    signal: 'High-velocity recycling of virtual card Instrument-4 (Visa 8812)',
  },
  {
    customerId: 'C102',
    merchantName: 'ByteWave Cloud Credits',
    amount: 46750,
    riskScore: 0.93,
    status: 'HELD' as const,
    riskBand: 'CRITICAL' as const,
    signal: 'Ingress routed via Tor Exit Relay Node #41 + rapid IP switching',
  },
  {
    customerId: 'C118',
    merchantName: 'Apex Electronics Express',
    amount: 47120,
    riskScore: 0.94,
    status: 'BLOCKED' as const,
    riskBand: 'CRITICAL' as const,
    signal: 'Sub-₹50,000 KYC structuring pattern linked to Address-12 cluster',
  },
  {
    customerId: 'C125',
    merchantName: 'QuickPerks GiftCards India',
    amount: 48300,
    riskScore: 0.96,
    status: 'BLOCKED' as const,
    riskBand: 'CRITICAL' as const,
    signal: 'Automated headless browser automation signature on shared device',
  },
];

export function SentinelConsole({ 
  initialPage = 'overview', 
  onBackToHero,
  currentUser,
  isAuthLoading 
}: SentinelConsoleProps) {
  const [currentPage, setCurrentPage] = useState<AppPage>(initialPage);
  
  // App-wide state
  const [cases, setCases] = useState<RiskCase[]>(MOCK_CASES);
  const [selectedCase, setSelectedCase] = useState<RiskCase | null>(MOCK_CASES[0]);
  const [policy, setPolicy] = useState<PolicyConfig>(ACTIVE_POLICY);
  const [selectedGraphNode, setSelectedGraphNode] = useState<GraphNode | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Real-time telemetry state
  const [transactions, setTransactions] = useState<TransactionRecord[]>(MOCK_TRANSACTIONS);
  const [toasts, setToasts] = useState<HighPriorityToast[]>([]);
  const [highlightedTxId, setHighlightedTxId] = useState<string | null>(null);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);

  const txSequenceRef = useRef<number>(98422);
  const poolIndexRef = useRef<number>(0);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Sync user customized data from Cloud Firestore when authenticated
  useEffect(() => {
    if (!currentUser) return;
    let isCancelled = false;

    const loadUserData = async () => {
      try {
        const [savedCasesMap, savedPolicy] = await Promise.all([
          loadUserCasesFromFirestore(currentUser.uid),
          loadUserPolicyFromFirestore(currentUser.uid),
        ]);

        if (isCancelled) return;

        if (savedPolicy) {
          setPolicy(prev => ({ ...prev, ...savedPolicy }));
        }

        if (Object.keys(savedCasesMap).length > 0) {
          setCases(prev => prev.map(c => {
            const saved = savedCasesMap[c.id];
            if (saved) {
              return {
                ...c,
                status: saved.status as any,
                decision: {
                  action: saved.action,
                  policyVersion: ACTIVE_POLICY.version,
                  modelVersion: EVALUATION_DATA.modelVersion,
                  decidedBy: currentUser.displayName || currentUser.email || 'Analyst',
                  decidedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
                  reason: saved.reason,
                }
              };
            }
            return c;
          }));
        }
      } catch (err) {
        console.error('Error loading user Firestore data:', err);
      }
    };

    loadUserData();
    return () => {
      isCancelled = true;
    };
  }, [currentUser]);

  // Trigger a new high-priority transaction
  const triggerNewHighPriorityTransaction = useCallback(() => {
    const nextSeq = txSequenceRef.current++;
    const template = SIMULATED_ATTACK_POOL[poolIndexRef.current % SIMULATED_ATTACK_POOL.length];
    poolIndexRef.current++;

    const now = new Date();
    const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const formattedTimeOnly = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newTx: TransactionRecord = {
      id: `TX-${nextSeq}`,
      customerId: template.customerId,
      merchantId: 'M-QP-01',
      merchantName: template.merchantName,
      amount: template.amount,
      timestamp: formattedTimestamp,
      deviceId: 'Device-17',
      ipId: 'IP-08',
      addressId: 'Address-12',
      instrumentId: 'Instrument-4',
      status: template.status,
      riskScore: template.riskScore,
      riskBand: template.riskBand,
      action: template.status === 'BLOCKED' ? 'BLOCK' : 'HOLD',
      ringId: 'RING-017',
      evidence: [
        {
          signal: 'GRAPH_HARDWARE_SYBIL',
          value: 'Device-17 overlap',
          contribution: 0.45,
          severity: 'critical',
          explanation: template.signal,
        },
      ],
    };

    // 1. Add to live transactions stream
    setTransactions(prev => [newTx, ...prev]);
    setHighlightedTxId(newTx.id);

    // 2. Trigger high-priority toast notification
    const newToast: HighPriorityToast = {
      id: `toast-${newTx.id}-${Date.now()}`,
      transaction: newTx,
      receivedAt: formattedTimeOnly,
      autoDismissMs: 8000,
    };

    setToasts(prev => [newToast, ...prev.slice(0, 2)]); // Keep maximum 3 toasts simultaneously

    // 3. Update the associated case at-risk volume & count in real-time
    setCases(prev => prev.map(c => {
      if (c.id === 'CASE-RING-017' || c.customerIds.includes(template.customerId)) {
        return {
          ...c,
          totalVolume: c.totalVolume + template.amount,
          totalTransactions: c.totalTransactions + 1,
          updatedAt: formattedTimestamp,
        };
      }
      return c;
    }));
  }, []);

  // Periodic real-time stream timer (every 14 seconds when live streaming is active)
  useEffect(() => {
    if (!isLiveStreaming) return;

    const timer = setInterval(() => {
      triggerNewHighPriorityTransaction();
    }, 14000);

    return () => clearInterval(timer);
  }, [isLiveStreaming, triggerNewHighPriorityTransaction]);

  // Connect to Server-Sent Events (SSE) from the REST API: GET /api/transactions/stream
  // Any transaction posted to POST /api/transactions/ingest will arrive here in real time!
  useEffect(() => {
    // 1. Initial catch-up fetch for transactions ingested via webhook while client was loading
    fetch('/api/transactions')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const newOnes = (data.transactions as TransactionRecord[]).filter(t => !existingIds.has(t.id));
            if (newOnes.length > 0) {
              return [...newOnes, ...prev];
            }
            return prev;
          });
        }
      })
      .catch(err => {
        // Silently catch during startup
      });

    // 2. Open real-time SSE stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/transactions/stream');

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed && parsed.type === 'CONNECTED') {
            return;
          }

          const incomingTx = parsed as TransactionRecord;
          if (incomingTx && incomingTx.id) {
            setTransactions(prev => {
              if (prev.some(t => t.id === incomingTx.id)) return prev;
              return [incomingTx, ...prev];
            });

            setHighlightedTxId(incomingTx.id);

            // Trigger real-time High-Priority Alert Toast for high/critical risks
            if (incomingTx.riskBand === 'CRITICAL' || incomingTx.riskBand === 'HIGH') {
              const now = new Date();
              const formattedTimeOnly = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const newToast: HighPriorityToast = {
                id: `toast-webhook-${incomingTx.id}-${Date.now()}`,
                transaction: incomingTx,
                receivedAt: formattedTimeOnly,
                autoDismissMs: 8000,
              };
              setToasts(prev => [newToast, ...prev.slice(0, 2)]);
            }

            // Update associated case metrics in real-time
            if (incomingTx.ringId === 'RING-017' || incomingTx.customerId.includes('101')) {
              setCases(prev => prev.map(c => {
                if (c.id === 'CASE-RING-017') {
                  return {
                    ...c,
                    totalVolume: c.totalVolume + incomingTx.amount,
                    totalTransactions: c.totalTransactions + 1,
                    updatedAt: incomingTx.timestamp,
                  };
                }
                return c;
              }));
            }
          }
        } catch (err) {
          console.error('[SSE] Failed to parse stream message', err);
        }
      };

      eventSource.onerror = () => {
        // EventSource will automatically retry connection
      };
    } catch (err) {
      console.warn('[SSE] EventSource init failed:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Developer-only: Send test transaction through the real webhook pipeline
  const handleSendTestWebhookTransaction = async () => {
    try {
      const sampleTx = {
        transaction_id: `TXN_${Math.floor(10000 + Math.random() * 90000)}`,
        customer_id: 'CUS_101',
        merchant_id: 'MERCHANT_22',
        amount: 24999,
        currency: 'INR',
        device_id: 'DEV_77',
        ip_address: '103.21.45.67',
        payment_instrument_id: 'CARD_TOKEN_12',
        timestamp: new Date().toISOString(),
      };

      const res = await fetch('/api/transactions/test-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleTx),
      });

      if (res.ok) {
        const data = await res.json();
        showNotification(`Webhook Test: Ingested ${sampleTx.transaction_id} (Score: ${data.transaction.riskScore} • ${data.transaction.action})`);
      } else {
        const err = await res.json();
        showNotification(`Webhook Test Error: ${err.error || 'Failed'}`);
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to connect to webhook test route');
    }
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleInvestigateToast = (tx: TransactionRecord) => {
    setHighlightedTxId(tx.id);
    setCurrentPage('overview');
    handleDismissToast(`toast-${tx.id}`);
    
    // Automatically smooth-scroll to recent risk transactions table if in Overview
    setTimeout(() => {
      const row = document.getElementById(`tx-row-${tx.id}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleSelectCaseFromOverview = (caseItem: RiskCase) => {
    setSelectedCase(caseItem);
    setCurrentPage('cases');
  };

  const handleUpdateCaseDecision = async (caseId: string, action: RecommendedAction, reason: string) => {
    const targetCase = cases.find(c => c.id === caseId);
    const updatedCase = targetCase ? {
      ...targetCase,
      status: action === 'BLOCK' ? 'RESOLVED' as const : 'INVESTIGATING' as const,
      decision: {
        action,
        policyVersion: policy.version,
        modelVersion: EVALUATION_DATA.modelVersion,
        decidedBy: currentUser?.displayName || currentUser?.email || 'Sarah Chen (Analyst)',
        decidedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
        reason,
      }
    } : null;

    setCases(prev => prev.map(c => {
      if (c.id === caseId && updatedCase) {
        return updatedCase;
      }
      return c;
    }));

    if (currentUser && targetCase) {
      try {
        await saveUserCaseDecisionToFirestore(currentUser.uid, targetCase, action, reason);
        showNotification(`Case ${caseId} updated: Enforced ${action} • Persisted to Firestore`);
      } catch (err) {
        console.error(err);
        showNotification(`Case ${caseId} updated locally (Firestore sync notice)`);
      }
    } else {
      showNotification(`Case ${caseId} updated: Enforced ${action} • Sign in to sync to Cloud Firestore`);
    }
  };

  const handleUpdatePolicy = async (updatedPolicy: PolicyConfig) => {
    setPolicy(updatedPolicy);
    if (currentUser) {
      try {
        await saveUserPolicyToFirestore(currentUser.uid, updatedPolicy);
        showNotification(`Policy saved: Block threshold set to ${updatedPolicy.blockThreshold.toFixed(2)} • Persisted to Firestore`);
      } catch (err) {
        console.error(err);
        showNotification(`Policy updated locally: Block threshold ${updatedPolicy.blockThreshold.toFixed(2)}`);
      }
    } else {
      showNotification(`Policy updated: Block threshold set to ${updatedPolicy.blockThreshold.toFixed(2)} • Sign in to sync to Cloud Firestore`);
    }
  };

  const navItems: { id: AppPage; label: string; icon: typeof LayoutDashboard; tooltip: string }[] = [
    { 
      id: 'overview', 
      label: '1. Overview', 
      icon: LayoutDashboard,
      tooltip: 'A live command screen streaming every payment in real time, with instant flashing alerts the moment a coordinated fraud gang attack is spotted.'
    },
    { 
      id: 'ring-explorer', 
      label: '2. Ring Explorer', 
      icon: Network,
      tooltip: 'An interactive visual chart where you can see all the nodes (accounts, computers, credit cards, Wi-Fi networks) and physically see how the criminal gang is linked together behind the scenes.'
    },
    { 
      id: 'cases', 
      label: '3. Cases', 
      icon: FolderLock,
      tooltip: 'A clean dashboard where your security team can press "Auto-Block Ring" to freeze all the gang\'s accounts at once. It even has a button that generates an official police report ready to submit to India\'s 1930 Cyber Crime Portal and the banks.'
    },
    { 
      id: 'evaluation', 
      label: '4. Evaluation', 
      icon: BarChart3,
      tooltip: 'A rigorous scientific benchmark testing 5,000 transactions on 15 unseen rings, featuring an interactive Financial Cost Frontier to mathematically minimize chargebacks and user friction.'
    },
    { 
      id: 'policy', 
      label: '5. Policy', 
      icon: Sliders,
      tooltip: 'Customizable threshold controls allowing you to set automated block and step-up limits, plus regulatory protection against RBI sub-₹50,000 KYC structuring and virtual card recycling.'
    },
    { 
      id: 'docs', 
      label: '6. Docs & FAQ', 
      icon: BookOpen,
      tooltip: 'Complete project walkthrough, How-to guides, API integration examples, troubleshooting playbooks, and system FAQs.'
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2F2EE] text-[#192837] flex flex-col selection:bg-[#7342E2] selection:text-white">
      {/* Toast Notification Container for High-Priority Real-Time Interceptions */}
      <ToastNotificationContainer
        toasts={toasts}
        onDismiss={handleDismissToast}
        onInvestigate={handleInvestigateToast}
      />

      {/* Top Universal Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#192837]/10 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onBackToHero}
              className="p-2 rounded-xl hover:bg-[#F2F2EE] text-[#192837]/70 hover:text-[#192837] transition-colors cursor-pointer"
              title="Return to Hero"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-3">
              <RixorLogo />
              <span className="hidden sm:inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] font-semibold border border-[#7342E2]/20">
                Graph Intelligence
              </span>
            </div>
          </div>

          {/* 5-Page Navigation Pills with Hover Tooltips */}
          <nav className="flex items-center gap-1 bg-[#F2F2EE] p-1 rounded-2xl border border-[#192837]/10 text-xs font-semibold overflow-x-auto">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <InfoTooltip
                  key={item.id}
                  title={item.label}
                  content={item.tooltip}
                  position="bottom"
                  maxWidth="max-w-xs"
                >
                  <button
                    onClick={() => setCurrentPage(item.id)}
                    className={`px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-white text-[#192837] shadow-xs font-bold border border-[#192837]/10'
                        : 'text-[#192837]/70 hover:text-[#192837] hover:bg-black/5'
                    }`}
                  >
                    <Icon size={14} className={isActive ? 'text-[#7342E2]' : 'text-[#192837]/50'} />
                    <span>{item.label}</span>
                  </button>
                </InfoTooltip>
              );
            })}
          </nav>

          {/* Right Action Cluster: Quick Simulate Action + Test Webhook + Live Status + Google Sign-In & Firestore Bar */}
          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleSendTestWebhookTransaction}
              className="hidden md:flex px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#F2F2EE] text-[#192837] font-semibold items-center gap-1.5 transition-colors cursor-pointer border border-[#192837]/20 shadow-xs"
              title="Test the server-side REST webhook: POST /api/transactions/ingest"
            >
              <Zap size={13} className="text-[#7342E2]" />
              <span>Test Webhook</span>
            </button>

            <button
              onClick={triggerNewHighPriorityTransaction}
              className="hidden lg:flex px-3 py-1.5 rounded-xl bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-[#7342E2] font-semibold items-center gap-1.5 transition-colors cursor-pointer border border-[#7342E2]/20"
              title="Simulate immediate high-priority fraud detection"
            >
              <span>Simulate Attack</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>API Live (₹)</span>
            </div>

            {/* Google Sign-In with Firebase Auth & Cloud Firestore Status */}
            <FirebaseAuthBar 
              currentUser={currentUser || null} 
              isLoading={isAuthLoading} 
              onNotification={showNotification} 
            />
          </div>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#192837] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-white/10 animate-fade-in">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Page Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentPage === 'overview' && (
          <OverviewPage
            cases={cases}
            transactions={transactions}
            onSelectCase={handleSelectCaseFromOverview}
            onNavigateToRing={() => setCurrentPage('ring-explorer')}
            highlightedTxId={highlightedTxId}
            isLiveStreaming={isLiveStreaming}
            onToggleLiveStream={() => setIsLiveStreaming(v => !v)}
            onSimulateHighPriorityTx={triggerNewHighPriorityTransaction}
            onSendTestWebhookTx={handleSendTestWebhookTransaction}
          />
        )}

        {currentPage === 'ring-explorer' && (
          <RingGraphView
            nodes={INITIAL_RING_017_NODES}
            edges={INITIAL_RING_017_EDGES}
            selectedNode={selectedGraphNode}
            onSelectNode={setSelectedGraphNode}
          />
        )}

        {currentPage === 'cases' && (
          <CasesPage
            cases={cases}
            selectedCaseId={selectedCase?.id}
            onSelectCase={setSelectedCase}
            onUpdateCaseDecision={handleUpdateCaseDecision}
          />
        )}

        {currentPage === 'evaluation' && (
          <EvaluationPage 
            evaluationData={EVALUATION_DATA} 
            currentPolicyThreshold={policy.blockThreshold}
            onApplyPolicyThreshold={(newThreshold) => {
              handleUpdatePolicy({
                ...policy,
                blockThreshold: newThreshold,
                reviewThreshold: Math.max(0.40, Math.min(policy.reviewThreshold, newThreshold - 0.15))
              });
            }}
            onNavigateToPolicy={() => setCurrentPage('policy')}
          />
        )}

        {currentPage === 'policy' && (
          <PolicyPage policy={policy} onUpdatePolicy={handleUpdatePolicy} />
        )}

        {currentPage === 'docs' && (
          <DocumentationPage 
            onNavigatePage={setCurrentPage} 
            onSendTestWebhookTx={handleSendTestWebhookTransaction}
          />
        )}
      </main>
    </div>
  );
}
