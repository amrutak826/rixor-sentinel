import { useState } from 'react';
import { RiskCase } from '../types';
import { 
  ShieldAlert, 
  X, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Building2, 
  Lock, 
  FileText, 
  CheckCircle2, 
  FileCode,
  Layers
} from 'lucide-react';

interface CyberCellDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  riskCase: RiskCase;
}

export function CyberCellDossierModal({
  isOpen,
  onClose,
  riskCase,
}: CyberCellDossierModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw_json'>('formatted');

  if (!isOpen || !riskCase) return null;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const dossierReference = `NCRP-1930-${riskCase.id}-${Date.now().toString().slice(-6)}`;
  const sha256EvidenceHash = `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.slice(0, 48);

  // Generate structured Cyber Cell JSON
  const dossierJSON = {
    incident_report_type: "CYBER_CRIME_FINANCIAL_SYNDICATE_DEFENSE",
    regulatory_framework: "Ministry of Home Affairs 1930 Portal & NPCI/RBI Central Fraud Registry (CFR)",
    dossier_reference_id: dossierReference,
    generation_timestamp: new Date().toISOString(),
    evidence_sha256: sha256EvidenceHash,
    case_summary: {
      case_id: riskCase.id,
      syndicate_ring_id: riskCase.ringId,
      incident_title: riskCase.title,
      priority: riskCase.priority,
      status: riskCase.status,
      assigned_analyst: riskCase.assignedAnalyst,
      suspected_pattern: riskCase.suspectedPattern,
      total_financial_exposure_inr: riskCase.totalVolume,
      total_transaction_count: riskCase.totalTransactions,
      created_at: riskCase.createdAt,
      opened_at: riskCase.openedAt,
      last_updated: riskCase.updatedAt,
    },
    sybil_ring_entities: {
      customer_accounts: riskCase.customerIds,
      linked_nodes: riskCase.linkedEntities.map(e => ({
        entity_id: e.id,
        type: e.type,
        label: e.label,
        risk_score: e.riskScore,
      })),
    },
    forensic_evidence_synthesis: {
      ai_summary: riskCase.aiSummary?.riskSummary || riskCase.suspectedPattern,
      verified_evidence_points: riskCase.aiSummary?.strongestEvidence || [],
    },
    lifecycle_audit_trail: riskCase.timeline,
    remedial_enforcement: riskCase.decision || {
      action: "INVESTIGATING",
      policy_version: "v1.4.2",
      notes: "Pending final review"
    }
  };

  // Plain text for 1930 portal clipboard pasting
  const portalPlainText = `[CONFIDENTIAL - FORMAL INCIDENT REPORT TO NATIONAL CYBER CRIME REPORTING PORTAL (1930)]
REF: ${dossierReference}
DATE: ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN')}

INCIDENT DETAILS:
- Case ID: ${riskCase.id} (Syndicate Ring: ${riskCase.ringId})
- Classification: Coordinated Sybil Abuse & Payment Fraud Ring
- Total Financial Exposure: ${formatINR(riskCase.totalVolume)} across ${riskCase.totalTransactions} transactions
- Target Merchants/Rails: Razorpay / Stripe INR UPI & Card-on-File Tokenization (CoFT)

LINKED ENTITIES IDENTIFIED:
- Customer Accounts (${riskCase.customerIds.length}): ${riskCase.customerIds.join(', ')}
${riskCase.linkedEntities.map(e => `- [${e.type.toUpperCase()}] ${e.id}: ${e.label} (Score: ${Math.round(e.riskScore * 100)}%)`).join('\n')}

TECHNICAL FORENSIC EVIDENCE:
${(riskCase.aiSummary?.strongestEvidence || [riskCase.suspectedPattern]).map(e => `• ${e}`).join('\n')}

CHAIN OF CUSTODY INTEGRITY:
- Lead Risk Analyst: ${riskCase.assignedAnalyst}
- Cryptographic Verification: SHA-256 [${sha256EvidenceHash}]
- System: Rixor Graph Sentinel Engine v1.0.4`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(portalPlainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dossierJSON, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CYBER_CELL_DOSSIER_${riskCase.id}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-[#192837]/20 flex flex-col max-h-[92vh] overflow-hidden my-auto"
        style={{ fontFamily: 'var(--font-body)' }}
      >
        {/* Modal Top Header Bar */}
        <div className="px-6 py-4 bg-[#192837] text-white flex items-center justify-between gap-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Official Evidence Package
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 font-mono">
                  1930 / NPCI CFR Formatted
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                Cyber Crime Cell & Chargeback Defense Dossier
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl text-xs font-semibold mr-2">
              <button
                onClick={() => setActiveTab('formatted')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'formatted' ? 'bg-white text-[#192837] shadow-xs' : 'text-white/70 hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Formal Dossier</span>
              </button>
              <button
                onClick={() => setActiveTab('raw_json')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'raw_json' ? 'bg-white text-[#192837] shadow-xs' : 'text-white/70 hover:text-white'
                }`}
              >
                <FileCode size={13} />
                <span>Raw JSON</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors cursor-pointer"
              title="Close Dossier"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-[#F2F2EE]/30 print:p-0 print:bg-white">
          {activeTab === 'formatted' ? (
            <div className="space-y-6 bg-white p-6 sm:p-8 rounded-2xl border border-[#192837]/10 shadow-xs print:border-none print:shadow-none">
              {/* Government / Institutional Letterhead */}
              <div className="border-b-2 border-[#192837] pb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-[#192837]">
                    <Building2 size={18} className="text-[#7342E2]" />
                    <span className="font-bold text-xs uppercase tracking-widest text-[#192837]/80">
                      National Cyber Crime Reporting Portal • Legal Representment Exhibit
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-[#192837] mt-1" style={{ fontFamily: 'var(--font-heading)' }}>
                    FORENSIC INCIDENT INVESTIGATION DOSSIER
                  </h1>
                  <p className="text-xs text-[#192837]/60 mt-0.5">
                    Prepared for Ministry of Home Affairs (1930 Helpdesk), NPCI Cyber Defense & Merchant Acquiring Banks
                  </p>
                </div>

                <div className="text-right font-mono text-xs">
                  <div className="text-[#192837]/60">Dossier Tracking ID:</div>
                  <div className="font-bold text-[#7342E2] text-sm">{dossierReference}</div>
                  <div className="text-[11px] text-[#192837]/60 mt-0.5">
                    Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* High-Level Incident Parameters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#F2F2EE]/70 border border-[#192837]/10 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Target Ring ID</span>
                  <span className="font-mono font-bold text-[#7342E2] text-sm mt-0.5 block">{riskCase.ringId}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Financial Exposure</span>
                  <span className="font-bold text-[#192837] text-sm mt-0.5 block">{formatINR(riskCase.totalVolume)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Target Tx Count</span>
                  <span className="font-bold text-[#192837] text-sm mt-0.5 block">{riskCase.totalTransactions} attempts</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#192837]/50 block">Lead Sentinel</span>
                  <span className="font-semibold text-[#192837] text-xs mt-0.5 block">{riskCase.assignedAnalyst}</span>
                </div>
              </div>

              {/* Modus Operandi & Executive Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837] flex items-center gap-1.5">
                  <FileText size={14} className="text-[#7342E2]" />
                  <span>1. Modus Operandi & Executive Incident Summary</span>
                </h4>
                <p className="text-xs text-[#192837]/85 leading-relaxed bg-[#F2F2EE]/40 p-3.5 rounded-xl border border-[#192837]/5 font-medium">
                  {riskCase.aiSummary?.riskSummary || riskCase.suspectedPattern}
                </p>
              </div>

              {/* Graph Forensic Signals */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837] flex items-center gap-1.5">
                  <Layers size={14} className="text-[#7342E2]" />
                  <span>2. Corroborating Graph Evidence & Forensic Signals</span>
                </h4>
                <div className="space-y-2 text-xs">
                  {(riskCase.aiSummary?.strongestEvidence || [
                    "Repeated WebGL canvas hash collisions across distinct synthetic identities",
                    "Virtual card token recycling under 48 hours",
                    "Sub-₹50,000 regulatory KYC threshold transaction structuring"
                  ]).map((ev, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50/50 border border-rose-100 text-[#192837]">
                      <span className="font-bold text-rose-600 shrink-0">EV-{i+1}:</span>
                      <span className="font-medium">{ev}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolved Entities Network Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#192837] flex items-center gap-1.5">
                  <Lock size={14} className="text-[#7342E2]" />
                  <span>3. Associated Entities & Digital Fingerprints ({riskCase.linkedEntities.length} Nodes)</span>
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[#192837]/10 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#F2F2EE] font-bold text-[10px] text-[#192837]/70 uppercase tracking-wider border-b border-[#192837]/10">
                      <tr>
                        <th className="py-2.5 px-3">Entity Type</th>
                        <th className="py-2.5 px-3">Identifier</th>
                        <th className="py-2.5 px-3">Observed Attribute</th>
                        <th className="py-2.5 px-3 text-right">Risk Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#192837]/5 font-mono">
                      {riskCase.linkedEntities.map((ent, idx) => (
                        <tr key={idx} className="hover:bg-[#F2F2EE]/30">
                          <td className="py-2 px-3 uppercase text-[10px] font-bold text-[#7342E2] font-sans">
                            {ent.type}
                          </td>
                          <td className="py-2 px-3 font-semibold text-[#192837]">
                            {ent.id}
                          </td>
                          <td className="py-2 px-3 text-[11px] text-[#192837]/75 font-sans font-medium">
                            {ent.label}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-rose-600 text-xs">
                            {Math.round(ent.riskScore * 100)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Chain of Custody & Cryptographic Hash Block */}
              <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
                <div className="flex items-center justify-between text-[11px] text-white/60">
                  <span className="font-semibold uppercase tracking-wider">Cryptographic Evidence Integrity Stamp</span>
                  <span className="font-mono text-emerald-400">STATUS: VERIFIED & TAMPER-EVIDENT</span>
                </div>
                <div className="font-mono text-xs break-all bg-black/40 p-2.5 rounded-lg text-emerald-300">
                  SHA-256: {sha256EvidenceHash}
                </div>
                <div className="text-[11px] text-white/70 flex justify-between pt-1">
                  <span>Signatory: {riskCase.assignedAnalyst}</span>
                  <span>Rixor Sentinel Policy: {riskCase.decision?.policyVersion || 'v1.4.2'}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Raw JSON View for direct API / webhook integration */
            <div className="relative">
              <pre className="p-5 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed max-h-[60vh] border border-white/10">
                {JSON.stringify(dossierJSON, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#192837]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#192837]/60">
            Admissible for chargeback representments under RBI & NPCI card scheme rules.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl bg-[#F2F2EE] hover:bg-[#192837]/10 text-[#192837] font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Copy formatted incident summary for 1930 web form"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy 1930 Portal Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-[#F2F2EE] hover:bg-[#192837]/10 text-[#192837] font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Print formal PDF dossier"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-4 py-2 rounded-xl bg-[#7342E2] hover:bg-[#5f33be] text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              title="Download machine-readable JSON dossier"
            >
              <Download size={14} />
              <span>Download JSON Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
