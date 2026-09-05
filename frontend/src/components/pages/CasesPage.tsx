import { useState } from 'react';
import { 
  RiskCase, 
  CasePriority, 
  EntityType, 
  RecommendedAction 
} from '../../types';
import { CyberCellDossierModal } from '../CyberCellDossierModal';
import { InfoTooltip } from '../InfoTooltip';
import { 
  FolderLock, 
  Clock, 
  User, 
  Laptop, 
  CreditCard, 
  Globe, 
  MapPin, 
  Store, 
  Receipt, 
  ShieldAlert, 
  AlertTriangle, 
  AlertCircle, 
  ArrowLeft, 
  Sparkles, 
  CheckCircle, 
  Ban, 
  PauseCircle, 
  FileText, 
  Send 
} from 'lucide-react';

interface CasesPageProps {
  cases: RiskCase[];
  selectedCaseId?: string | null;
  onSelectCase: (c: RiskCase | null) => void;
  onUpdateCaseDecision: (caseId: string, action: RecommendedAction, reason: string) => void;
}

export function CasesPage({
  cases,
  selectedCaseId,
  onSelectCase,
  onUpdateCaseDecision,
}: CasesPageProps) {
  const [activeCaseId, setActiveCaseId] = useState<string>(
    selectedCaseId || (cases.length > 0 ? cases[0].id : '')
  );
  const [decisionReason, setDecisionReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);

  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0];

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

  const getEntityIcon = (type: EntityType) => {
    switch (type) {
      case 'device':
        return <Laptop size={14} className="text-rose-500" />;
      case 'payment_instrument':
        return <CreditCard size={14} className="text-purple-500" />;
      case 'ip':
        return <Globe size={14} className="text-amber-500" />;
      case 'address':
        return <MapPin size={14} className="text-sky-500" />;
      case 'merchant':
        return <Store size={14} className="text-emerald-500" />;
      case 'transaction':
        return <Receipt size={14} className="text-pink-500" />;
      case 'customer':
      default:
        return <User size={14} className="text-slate-600" />;
    }
  };

  const handleAction = (action: RecommendedAction) => {
    if (!activeCase) return;
    const reason = decisionReason || `Analyst manual action: ${action} enforced for ${activeCase.id}`;
    onUpdateCaseDecision(activeCase.id, action, reason);
    setDecisionReason('');
  };

  const handleAddNote = () => {
    if (!newNote.trim() || !activeCase) return;
    activeCase.notes.push(newNote.trim());
    setNewNote('');
  };

  return (
    <div className="space-y-6" style={{ fontFamily: 'var(--font-body)' }}>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <InfoTooltip
            title="Fraud Incident Investigation Cases"
            content="A clean dashboard where your security team can press 'Auto-Block Ring' to freeze all the gang's accounts at once. It even has a button that generates an official police report ready to submit to India's 1930 Cyber Crime Portal and the banks."
            position="top"
            maxWidth="max-w-md"
          >
            <h2 
              className="text-2xl font-bold text-[#192837] tracking-tight flex items-center gap-2.5 cursor-help"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <FolderLock size={24} className="text-[#7342E2]" />
              <span>Fraud Incident Investigation Cases</span>
            </h2>
          </InfoTooltip>
          <p className="text-xs text-[#192837]/70 mt-1">
            Click any case file to inspect the creation date, full lifecycle timeline, and linked entity network.
          </p>
        </div>

        <div className="text-xs text-[#192837]/60 bg-white px-3 py-1.5 rounded-xl border border-[#192837]/10 font-medium">
          Total Open Files: <strong className="text-[#192837]">{cases.length}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cases List (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-[#192837]/60 uppercase tracking-wider px-1">
            Case Files ({cases.length})
          </div>

          <div className="space-y-3">
            {cases.map((c) => {
              const isSelected = c.id === activeCaseId;
              return (
                <div
                  key={c.id}
                  onClick={() => setActiveCaseId(c.id)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                    isSelected
                      ? 'bg-white border-[#7342E2] ring-2 ring-[#7342E2]/20 shadow-md'
                      : 'bg-white/80 border-[#192837]/10 hover:border-[#192837]/25 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-[#192837] bg-[#F2F2EE] px-2 py-0.5 rounded border border-[#192837]/10">
                      {c.id}
                    </span>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(c.priority)}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#192837] line-clamp-1">
                    {c.title}
                  </h3>

                  {/* Customer IDs showcase */}
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
                    <span className="text-[#192837]/60 font-semibold">Customers:</span>
                    {c.customerIds.slice(0, 4).map(cid => (
                      <span key={cid} className="px-1.5 py-0.5 rounded bg-[#F2F2EE] font-mono text-[10px] font-medium text-[#192837]">
                        {cid}
                      </span>
                    ))}
                    {c.customerIds.length > 4 && (
                      <span className="text-[10px] text-[#7342E2] font-semibold">
                        +{c.customerIds.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Investigation Report snippet */}
                  <p className="mt-2 text-xs text-[#192837]/75 line-clamp-2">
                    {c.aiSummary?.riskSummary || c.suspectedPattern}
                  </p>

                  <div className="mt-3 pt-2 border-t border-[#192837]/10 flex items-center justify-between text-[11px] text-[#192837]/60">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>Opened: {c.openedAt.split(' ')[1] || c.openedAt}</span>
                    </span>
                    <span className="font-bold text-[#192837]">
                      {formatINR(c.totalVolume)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Case File Detail Drawer (7 cols) */}
        {/* Prompt: "wen the case file is clicked it should show wen the case was created with timeline and its linked entities" */}
        <div className="lg:col-span-7">
          {activeCase ? (
            <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-sm space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-[#192837]/10">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs font-bold bg-[#7342E2]/10 text-[#7342E2] px-2.5 py-1 rounded-lg">
                      {activeCase.id}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#192837]/60 bg-[#F2F2EE] px-2.5 py-1 rounded-lg">
                      {activeCase.ringId}
                    </span>
                    {getPriorityBadge(activeCase.priority)}
                  </div>
                  <h3 
                    className="text-xl font-bold text-[#192837]"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {activeCase.title}
                  </h3>
                  <p className="text-xs text-[#192837]/70 mt-1">
                    Assigned Sentinel: <strong>{activeCase.assignedAnalyst}</strong>
                  </p>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 tracking-wider block">
                    Total At-Risk Volume
                  </span>
                  <span className="text-xl font-bold text-[#192837]" style={{ fontFamily: 'var(--font-heading)' }}>
                    {formatINR(activeCase.totalVolume)}
                  </span>
                  <span className="text-[11px] text-[#192837]/60 block mt-0.5">
                    {activeCase.totalTransactions} transactions
                  </span>

                  <InfoTooltip
                    title="Export Official Cyber Cell Dossier"
                    content="One-click legal and regulatory incident exporter formatted with SHA-256 hashes, device telemetry, and IP timelines ready for submission to India's 1930 Cyber Crime Portal and bank chargeback teams."
                    position="left"
                    maxWidth="max-w-xs"
                  >
                    <button
                      onClick={() => setIsDossierModalOpen(true)}
                      className="mt-3 px-3 py-1.5 rounded-xl bg-[#7342E2]/10 hover:bg-[#7342E2]/20 text-[#7342E2] font-bold text-xs border border-[#7342E2]/25 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <FileText size={13} />
                      <span>Export Cyber Cell Dossier</span>
                    </button>
                  </InfoTooltip>
                </div>
              </div>

              {/* Creation Timestamps Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#192837]/50 block">Case Created</span>
                  <span className="font-mono font-bold text-[#192837] mt-0.5 block">{activeCase.createdAt}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#192837]/50 block">Opened in System</span>
                  <span className="font-mono font-bold text-[#7342E2] mt-0.5 block">{activeCase.openedAt}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#192837]/50 block">Last Active Influx</span>
                  <span className="font-mono font-bold text-[#192837] mt-0.5 block">{activeCase.updatedAt}</span>
                </div>
              </div>

              {/* Interactive Timeline */}
              {/* Prompt: "show wen the case was created with timeline" */}
              <div className="space-y-3">
                <InfoTooltip
                  title="Case Incident Timeline & Lifecycle"
                  content="Chronological audit trail recording account setup, transaction velocity bursts, AI graph clustering, and analyst containment actions."
                  position="top"
                  maxWidth="max-w-md"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/80 flex items-center gap-2 cursor-help">
                    <Clock size={14} className="text-[#7342E2]" />
                    <span>Case Incident Timeline & Lifecycle</span>
                  </h4>
                </InfoTooltip>

                <div className="relative pl-6 border-l-2 border-[#7342E2]/30 space-y-4 text-xs py-1">
                  {activeCase.timeline.map((step, idx) => (
                    <div key={idx} className="relative group">
                      {/* Step marker */}
                      <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-[#7342E2] ring-4 ring-white" />
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-bold text-[#192837] text-xs">
                          {step.title}
                        </span>
                        <span className="font-mono text-[11px] text-[#192837]/60">
                          {step.timestamp}
                        </span>
                      </div>
                      <p className="text-[#192837]/75 mt-0.5 text-xs font-medium">
                        {step.description}
                      </p>
                      {step.actor && (
                        <span className="inline-block mt-1 text-[10px] font-mono text-[#7342E2] bg-[#7342E2]/10 px-2 py-0.5 rounded">
                          Source: {step.actor}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Linked Entities Network Table */}
              {/* Prompt: "and its linked entities" */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <InfoTooltip
                    title="Linked Entities Resolved by Graph"
                    content="Physical and digital entities linked through multi-hop topological traversal: shared device hardware, recycled virtual PANs, and proxy nodes."
                    position="top"
                    maxWidth="max-w-md"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837]/80 flex items-center gap-2 cursor-help">
                      <User size={14} className="text-[#7342E2]" />
                      <span>Linked Entities ({activeCase.linkedEntities.length} resolved nodes)</span>
                    </h4>
                  </InfoTooltip>
                  <span className="text-[11px] text-[#192837]/60">
                    Cross-matched across Sybil graph
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-[#192837]/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F2F2EE] text-[#192837]/70 font-semibold uppercase tracking-wider text-[10px] border-b border-[#192837]/10">
                      <tr>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Entity Identifier</th>
                        <th className="py-2.5 px-3">Details</th>
                        <th className="py-2.5 px-3 text-right">Risk Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#192837]/5">
                      {activeCase.linkedEntities.map(ent => (
                        <tr key={ent.id} className="hover:bg-[#F2F2EE]/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="flex items-center gap-1.5 font-medium">
                              {getEntityIcon(ent.type)}
                              <span className="text-[11px]">{ent.type}</span>
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-[#192837]">
                            {ent.id}
                          </td>
                          <td className="py-2.5 px-3 text-[#192837]/75 font-medium text-[11px]">
                            {ent.label}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <span className={`font-mono font-bold text-[11px] ${
                              ent.riskScore >= 0.90 ? 'text-rose-600' : 'text-amber-600'
                            }`}>
                              {Math.round(ent.riskScore * 100)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Risk Synthesis & Evidence */}
              {activeCase.aiSummary && (
                <div className="p-4 rounded-2xl bg-[#7342E2]/5 border border-[#7342E2]/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#7342E2]">
                    <Sparkles size={14} />
                    <span>AI Investigation Synthesis</span>
                  </div>
                  <p className="text-xs text-[#192837] leading-relaxed font-medium">
                    {activeCase.aiSummary.riskSummary}
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#192837]/60 block">Key Discovered Evidence:</span>
                    {activeCase.aiSummary.strongestEvidence.map((ev, i) => (
                      <div key={i} className="text-xs text-[#192837]/80 flex items-start gap-1.5">
                        <span className="text-[#7342E2] font-bold">•</span>
                        <span>{ev}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analyst Action Enforcement */}
              <div className="p-5 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#192837] block">
                  Analyst Resolution Actions
                </span>

                <input
                  type="text"
                  placeholder="Enter decision rationale or ticket reference..."
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#192837]/15 text-xs text-[#192837] focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
                />

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <InfoTooltip
                    title="Block All Entities (Containment)"
                    content="Immediately blacklists all associated device hardware hashes, IP subnets, and cards across all merchant payment gateways."
                    position="top"
                    maxWidth="max-w-xs"
                  >
                    <button
                      onClick={() => handleAction('BLOCK')}
                      className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Ban size={14} />
                      <span>Block All Entities</span>
                    </button>
                  </InfoTooltip>

                  <InfoTooltip
                    title="Hold for KYC Verification"
                    content="Places queued checkout settlements on hold and triggers step-up Aadhaar/PAN re-verification challenge."
                    position="top"
                    maxWidth="max-w-xs"
                  >
                    <button
                      onClick={() => handleAction('HOLD')}
                      className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <PauseCircle size={14} />
                      <span>Hold for KYC Verification</span>
                    </button>
                  </InfoTooltip>

                  <InfoTooltip
                    title="Allow & Clear Case"
                    content="Marks the case resolved as benign legitimate customer behavior and prevents future false-positive blocks."
                    position="top"
                    maxWidth="max-w-xs"
                  >
                    <button
                      onClick={() => handleAction('ALLOW')}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <CheckCircle size={14} />
                      <span>Allow & Clear Case</span>
                    </button>
                  </InfoTooltip>

                  <button
                    onClick={() => setIsDossierModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    title="Export official incident package for 1930 Cyber Cell & Bank Chargeback representment"
                  >
                    <ShieldAlert size={14} className="text-rose-400" />
                    <span>Cyber Cell Dossier</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white rounded-3xl border border-[#192837]/10">
              Select a case from the left to view timeline and linked entities.
            </div>
          )}
        </div>
      </div>

      {/* Cyber Cell / Chargeback Dossier Modal */}
      {activeCase && (
        <CyberCellDossierModal
          isOpen={isDossierModalOpen}
          onClose={() => setIsDossierModalOpen(false)}
          riskCase={activeCase}
        />
      )}
    </div>
  );
}
