import { useState } from 'react';
import { 
  RiskCase, 
  TransactionRecord, 
  CasePriority, 
  RiskBand 
} from '../../types';
import { InfoTooltip } from '../InfoTooltip';
import { 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  TrendingUp, 
  Search, 
  Filter, 
  Layers, 
  Shield, 
  CreditCard,
  Radio,
  Zap,
  Play,
  Pause,
  Bell,
  Terminal,
  Send
} from 'lucide-react';

interface OverviewPageProps {
  cases: RiskCase[];
  transactions: TransactionRecord[];
  onSelectCase: (caseItem: RiskCase) => void;
  onNavigateToRing: () => void;
  highlightedTxId?: string | null;
  isLiveStreaming?: boolean;
  onToggleLiveStream?: () => void;
  onSimulateHighPriorityTx?: () => void;
  onSendTestWebhookTx?: () => void;
}

export function OverviewPage({
  cases,
  transactions,
  onSelectCase,
  onNavigateToRing,
  highlightedTxId,
  isLiveStreaming = true,
  onToggleLiveStream,
  onSimulateHighPriorityTx,
  onSendTestWebhookTx,
}: OverviewPageProps) {
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [txFilter, setTxFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cases by priority
  const filteredCases = cases.filter(c => {
    if (priorityFilter !== 'all' && c.priority !== priorityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = c.title.toLowerCase().includes(q);
      const matchesId = c.id.toLowerCase().includes(q);
      const matchesCust = c.customerIds.some(cid => cid.toLowerCase().includes(q));
      if (!matchesTitle && !matchesId && !matchesCust) return false;
    }
    return true;
  });

  const criticalCases = filteredCases.filter(c => c.priority === 'CRITICAL');
  const highCases = filteredCases.filter(c => c.priority === 'HIGH');
  const mediumCases = filteredCases.filter(c => c.priority === 'MEDIUM');

  // Filter transactions (at least 15 showcased)
  const filteredTransactions = transactions.filter(tx => {
    if (txFilter === 'blocked' && tx.status !== 'BLOCKED') return false;
    if (txFilter === 'held' && tx.status !== 'HELD') return false;
    if (txFilter === 'review' && tx.status !== 'REVIEW') return false;
    if (txFilter === 'allowed' && tx.status !== 'ALLOWED') return false;
    return true;
  });

  // Aggregated stats in INR (1$ = 94.45 ₹)
  const totalVolumeInAtRisk = cases.reduce((acc, c) => acc + c.totalVolume, 0);
  const totalCriticalVolume = cases
    .filter(c => c.priority === 'CRITICAL')
    .reduce((acc, c) => acc + c.totalVolume, 0);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getPriorityBadge = (priority: CasePriority) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
            <ShieldAlert size={12} />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle size={12} />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle size={12} />
            MEDIUM
          </span>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">New</span>;
      case 'INVESTIGATING':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">Investigating</span>;
      case 'TRIAGED':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">Triaged</span>;
      case 'RESOLVED':
        return <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Resolved</span>;
      default:
        return null;
    }
  };

  const getTxStatusBadge = (status: string, riskBand: RiskBand) => {
    switch (status) {
      case 'BLOCKED':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700">BLOCKED</span>;
      case 'HELD':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-100 text-amber-800">HELD</span>;
      case 'REVIEW':
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-100 text-blue-800">REVIEW</span>;
      case 'ALLOWED':
      default:
        return <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800">ALLOWED</span>;
    }
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      {/* 1. Top Executive KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoTooltip
          title="Total Sybil Exposure"
          content="Total monetary amount at direct risk across identified collusive fraud rings, calculated in Indian Rupees (₹) with priority weightings."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <div className="flex items-center justify-between text-xs font-semibold text-[#192837]/60 uppercase tracking-wider">
              <span>Total Sybil Exposure</span>
              <TrendingUp size={16} className="text-rose-500" />
            </div>
            <div className="text-2xl font-bold text-[#192837] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {formatINR(totalVolumeInAtRisk)}
            </div>
            <div className="text-xs text-rose-600 font-medium mt-1">
              {formatINR(totalCriticalVolume)} in Critical Priority
            </div>
          </div>
        </InfoTooltip>

        <InfoTooltip
          title="Active Investigation Cases"
          content="Coordinated multi-entity fraud rings undergoing automated topological clustering, graph-edge resolution, and active analyst triage."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <div className="flex items-center justify-between text-xs font-semibold text-[#192837]/60 uppercase tracking-wider">
              <span>Active Investigation Cases</span>
              <ShieldAlert size={16} className="text-[#7342E2]" />
            </div>
            <div className="text-2xl font-bold text-[#192837] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {cases.length} Open Rings
            </div>
            <div className="text-xs text-[#192837]/70 mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>2 Critical • 2 High • 2 Medium</span>
            </div>
          </div>
        </InfoTooltip>

        <InfoTooltip
          title="Recent Risk Transactions"
          content="A live command screen streaming every payment in real time, with instant flashing alerts if a fraud gang attack is spotted."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <div className="flex items-center justify-between text-xs font-semibold text-[#192837]/60 uppercase tracking-wider">
              <span>Recent Risk Transactions</span>
              <CreditCard size={16} className="text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-[#192837] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {transactions.length} Evaluated
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">
              At least 15 live telemetry events tracked
            </div>
          </div>
        </InfoTooltip>

        <InfoTooltip
          title="Automated Interception"
          content="Percentage of confirmed syndicate attacks autonomously intercepted or challenged prior to fulfillment, preserving merchant margin."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <div className="flex items-center justify-between text-xs font-semibold text-[#192837]/60 uppercase tracking-wider">
              <span>Automated Interception</span>
              <Shield size={16} className="text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              94.2%
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1">
              Precision against held-out ground truth
            </div>
          </div>
        </InfoTooltip>
      </div>

      {/* 2. Active Cases Section (Showcasing Critical, High, Medium Priority) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#192837]/10">
          <div>
            <InfoTooltip
              title="Active Investigation Cases by Priority"
              content="Sybil syndicates categorized by urgency. Critical: Immediate payment velocity bursting. High: Shared hardware fingerprints. Medium: Proxy masking & structuring."
              position="top"
              maxWidth="max-w-sm"
            >
              <h2 
                className="text-xl font-bold text-[#192837] tracking-tight flex items-center gap-2.5 cursor-help"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <Layers size={22} className="text-[#7342E2]" />
                <span>Active Investigation Cases by Priority</span>
              </h2>
            </InfoTooltip>
            <p className="text-xs text-[#192837]/70 mt-1">
              Sybil syndicates clustered across shared devices, Tor proxies, and virtual PANs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Priority Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-[#F2F2EE] p-1 rounded-xl text-xs font-medium text-[#192837]">
              <button
                onClick={() => setPriorityFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  priorityFilter === 'all' ? 'bg-white shadow-xs font-bold text-[#192837]' : 'hover:bg-black/5'
                }`}
              >
                All ({cases.length})
              </button>
              <button
                onClick={() => setPriorityFilter('CRITICAL')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  priorityFilter === 'CRITICAL' ? 'bg-rose-500 text-white font-bold shadow-xs' : 'hover:bg-black/5 text-rose-700'
                }`}
              >
                Critical (2)
              </button>
              <button
                onClick={() => setPriorityFilter('HIGH')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  priorityFilter === 'HIGH' ? 'bg-amber-500 text-white font-bold shadow-xs' : 'hover:bg-black/5 text-amber-700'
                }`}
              >
                High (2)
              </button>
              <button
                onClick={() => setPriorityFilter('MEDIUM')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  priorityFilter === 'MEDIUM' ? 'bg-blue-600 text-white font-bold shadow-xs' : 'hover:bg-black/5 text-blue-700'
                }`}
              >
                Medium (2)
              </button>
            </div>
          </div>
        </div>

        {/* Priority Groups */}
        <div className="space-y-6">
          {/* Critical Priority Group */}
          {(priorityFilter === 'all' || priorityFilter === 'CRITICAL') && criticalCases.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-rose-700">
                  Critical Priority Cases ({criticalCases.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {criticalCases.map(c => (
                  <div 
                    key={c.id} 
                    className="p-5 rounded-2xl bg-rose-50/40 border-2 border-rose-200/90 hover:border-rose-300 transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-rose-800 bg-white px-2.5 py-1 rounded-lg border border-rose-200">
                          {c.id}
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(c.status)}
                          {getPriorityBadge(c.priority)}
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-[#192837] group-hover:text-rose-700 transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-xs text-[#192837]/75 mt-1 line-clamp-2 font-medium">
                        {c.suspectedPattern}
                      </p>

                      {/* Customer IDs linked */}
                      <div className="mt-3 pt-3 border-t border-rose-200/60 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-semibold text-[#192837]/60">Customers:</span>
                        {c.customerIds.map(cid => (
                          <span key={cid} className="px-2 py-0.5 rounded bg-white text-[11px] font-mono font-medium text-[#192837] border border-rose-200">
                            {cid}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-rose-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#192837]/60 uppercase tracking-wider block">At-Risk Volume</span>
                        <span className="text-base font-bold text-[#192837]">{formatINR(c.totalVolume)}</span>
                      </div>
                      <button
                        onClick={() => onSelectCase(c)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>Investigate Case</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* High Priority Group */}
          {(priorityFilter === 'all' || priorityFilter === 'HIGH') && highCases.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-800">
                  High Priority Cases ({highCases.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highCases.map(c => (
                  <div 
                    key={c.id} 
                    className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 hover:border-amber-300 transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-200">
                          {c.id}
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(c.status)}
                          {getPriorityBadge(c.priority)}
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-[#192837] group-hover:text-amber-800 transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-xs text-[#192837]/75 mt-1 line-clamp-2 font-medium">
                        {c.suspectedPattern}
                      </p>

                      <div className="mt-3 pt-3 border-t border-amber-200/60 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-semibold text-[#192837]/60">Customers:</span>
                        {c.customerIds.map(cid => (
                          <span key={cid} className="px-2 py-0.5 rounded bg-white text-[11px] font-mono font-medium text-[#192837] border border-amber-200">
                            {cid}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#192837]/60 uppercase tracking-wider block">At-Risk Volume</span>
                        <span className="text-base font-bold text-[#192837]">{formatINR(c.totalVolume)}</span>
                      </div>
                      <button
                        onClick={() => onSelectCase(c)}
                        className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>Investigate Case</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medium Priority Group */}
          {(priorityFilter === 'all' || priorityFilter === 'MEDIUM') && mediumCases.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-blue-800">
                  Medium Priority Cases ({mediumCases.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mediumCases.map(c => (
                  <div 
                    key={c.id} 
                    className="p-5 rounded-2xl bg-blue-50/40 border border-blue-200 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-blue-900 bg-white px-2.5 py-1 rounded-lg border border-blue-200">
                          {c.id}
                        </span>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(c.status)}
                          {getPriorityBadge(c.priority)}
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-[#192837] group-hover:text-blue-800 transition-colors">
                        {c.title}
                      </h4>
                      <p className="text-xs text-[#192837]/75 mt-1 line-clamp-2 font-medium">
                        {c.suspectedPattern}
                      </p>

                      <div className="mt-3 pt-3 border-t border-blue-200/60 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] font-semibold text-[#192837]/60">Customers:</span>
                        {c.customerIds.map(cid => (
                          <span key={cid} className="px-2 py-0.5 rounded bg-white text-[11px] font-mono font-medium text-[#192837] border border-blue-200">
                            {cid}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#192837]/60 uppercase tracking-wider block">At-Risk Volume</span>
                        <span className="text-base font-bold text-[#192837]">{formatINR(c.totalVolume)}</span>
                      </div>
                      <button
                        onClick={() => onSelectCase(c)}
                        className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <span>Investigate Case</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Recent Risk Transactions (Prompt: "and should showcase the recent risk transactions at least 15 of them") */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#192837]/10">
          <div>
            <div className="flex items-center gap-2">
              <InfoTooltip
                title="Recent Risk Transactions Telemetry"
                content="A live stream showing every payment coming into the store in real time, with flashing alerts if a fraud gang attack is spotted."
                position="top"
                maxWidth="max-w-md"
              >
                <h2 
                  className="text-xl font-bold text-[#192837] tracking-tight cursor-help flex items-center gap-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  <Radio size={20} className="text-[#7342E2]" />
                  <span>Recent Risk Transactions Telemetry</span>
                </h2>
              </InfoTooltip>
              <span className="px-2.5 py-0.5 rounded-full bg-[#7342E2]/10 text-[#7342E2] font-mono text-xs font-bold">
                {filteredTransactions.length} Tracked
              </span>
            </div>
          </div>

          {/* Filter Status & Live Telemetry Controls */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Live Telemetry Stream Indicator and Controls */}
            <div className="flex items-center gap-2 bg-[#F2F2EE] px-3 py-1.5 rounded-xl border border-[#192837]/10">
              <span className={`w-2 h-2 rounded-full ${isLiveStreaming ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-semibold text-[#192837]">
                {isLiveStreaming ? 'Live Stream Active' : 'Stream Paused'}
              </span>
              {onToggleLiveStream && (
                <button
                  onClick={onToggleLiveStream}
                  className="ml-1 px-2 py-0.5 rounded bg-white hover:bg-black/5 text-[10px] font-bold text-[#192837] border border-[#192837]/15 transition-colors cursor-pointer"
                >
                  {isLiveStreaming ? 'Pause' : 'Resume'}
                </button>
              )}
            </div>

            {/* Simulate High-Priority Transaction Button */}
            {onSimulateHighPriorityTx && (
              <button
                onClick={onSimulateHighPriorityTx}
                className="px-3 py-1.5 rounded-xl bg-[#7342E2] hover:brightness-110 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                title="Trigger a simulated incoming high-priority transaction to test real-time detection & toast"
              >
                <Zap size={13} />
                <span>Simulate High-Priority</span>
              </button>
            )}

            {/* Developer-only Send Test Webhook Transaction Button */}
            {onSendTestWebhookTx && (
              <button
                onClick={onSendTestWebhookTx}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F2F2EE] text-[#192837] font-semibold text-xs flex items-center gap-1.5 transition-all border border-[#192837]/20 shadow-xs cursor-pointer"
                title="Send a sample transaction via the POST /api/transactions/ingest webhook pipeline without exposing secret"
              >
                <Terminal size={13} className="text-[#7342E2]" />
                <span>Send Test Webhook</span>
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <span className="text-[#192837]/60 font-medium">Action:</span>
              <select
                value={txFilter}
                onChange={(e) => setTxFilter(e.target.value)}
                className="bg-[#F2F2EE] border border-[#192837]/15 rounded-xl px-2.5 py-1.5 text-xs text-[#192837] font-medium focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
              >
                <option value="all">All Actions ({transactions.length})</option>
                <option value="blocked">Blocked Only</option>
                <option value="held">Held Only</option>
                <option value="review">Review Only</option>
                <option value="allowed">Allowed Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table (at least 15 rows) */}
        <div className="overflow-x-auto rounded-2xl border border-[#192837]/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2EE]/80 text-[#192837]/70 font-semibold uppercase tracking-wider text-[11px] border-b border-[#192837]/10">
              <tr>
                <th className="py-3.5 px-4">Tx ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Target Merchant</th>
                <th className="py-3.5 px-4">Amount (₹)</th>
                <th className="py-3.5 px-4">Risk Score</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Primary Signal</th>
                <th className="py-3.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192837]/5 text-[#192837]">
              {filteredTransactions.map((tx) => {
                const isHighlighted = highlightedTxId === tx.id;
                return (
                  <tr 
                    key={tx.id} 
                    id={`tx-row-${tx.id}`}
                    className={`transition-all duration-300 group cursor-default ${
                      isHighlighted 
                        ? 'bg-rose-50/80 ring-2 ring-rose-500 font-semibold' 
                        : 'hover:bg-[#F2F2EE]/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#192837] flex items-center gap-1.5">
                      {isHighlighted && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                      )}
                      <span>{tx.id}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono bg-[#F2F2EE] px-2 py-0.5 rounded text-[11px] font-medium border border-[#192837]/10">
                        {tx.customerId}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {tx.merchantName}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono text-[#192837]">
                      {formatINR(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div 
                            className={`h-full ${
                              tx.riskScore >= 0.90 
                                ? 'bg-rose-500' 
                                : tx.riskScore >= 0.70 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.round(tx.riskScore * 100)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-[11px]">
                          {Math.round(tx.riskScore * 100)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getTxStatusBadge(tx.status, tx.riskBand)}
                    </td>
                    <td className="py-3.5 px-4 text-[#192837]/75 max-w-xs truncate font-medium">
                      {tx.evidence[0]?.explanation || 'Baseline behavioral flow'}
                    </td>
                    <td className="py-3.5 px-4 text-[#192837]/60 font-mono text-[11px] whitespace-nowrap">
                      {tx.timestamp.split(' ')[1]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
