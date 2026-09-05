import React, { useState } from 'react';
import { AppPage } from '../SentinelConsole';
import { InfoTooltip } from '../InfoTooltip';
import { 
  BookOpen, 
  HelpCircle, 
  Terminal, 
  ShieldAlert, 
  Network, 
  Zap, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  Search, 
  ChevronRight, 
  Sliders, 
  FolderLock, 
  BarChart3, 
  Scale, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Server,
  Layers,
  Cpu
} from 'lucide-react';

interface DocumentationPageProps {
  onNavigatePage: (page: AppPage) => void;
  onSendTestWebhookTx?: () => void;
}

type DocCategory = 'walkthrough' | 'guides' | 'troubleshooting' | 'faqs';

export function DocumentationPage({ onNavigatePage, onSendTestWebhookTx }: DocumentationPageProps) {
  const [activeCategory, setActiveCategory] = useState<DocCategory>('walkthrough');
  const [searchQuery, setSearchQuery] = useState('');
  const [codeLanguage, setCodeLanguage] = useState<'curl' | 'python' | 'javascript'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const curlExample = `curl -X POST https://your-domain.com/api/transactions/ingest \\
  -H "Content-Type: application/json" \\
  -d '{
    "customerId": "C119",
    "amountINR": 48500,
    "merchant": "QuickPerks GiftCards India",
    "deviceFingerprint": "Device-17",
    "ipAddress": "103.21.244.12",
    "paymentInstrument": "Instrument-4",
    "billingAddress": "Address-12",
    "timestamp": "${new Date().toISOString()}"
  }'`;

  const pythonExample = `import requests

payload = {
    "customerId": "C119",
    "amountINR": 48500,
    "merchant": "QuickPerks GiftCards India",
    "deviceFingerprint": "Device-17",
    "ipAddress": "103.21.244.12",
    "paymentInstrument": "Instrument-4",
    "billingAddress": "Address-12",
    "timestamp": "2026-09-05T10:15:00Z"
}

response = requests.post(
    "https://your-domain.com/api/transactions/ingest",
    json=payload,
    timeout=2.0
)

result = response.json()
print(f"Verdict: {result.get('action')} | Risk Score: {result.get('riskScore')}")`;

  const jsExample = `const payload = {
  customerId: "C119",
  amountINR: 48500,
  merchant: "QuickPerks GiftCards India",
  deviceFingerprint: "Device-17",
  ipAddress: "103.21.244.12",
  paymentInstrument: "Instrument-4",
  billingAddress: "Address-12",
  timestamp: new Date().toISOString()
};

const res = await fetch("/api/transactions/ingest", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload)
});

const decision = await res.json();
console.log("Decision:", decision.action, "Score:", decision.riskScore);`;

  const responseExample = `{
  "transactionId": "TX-MOCK-9821",
  "action": "BLOCK",
  "riskScore": 0.94,
  "flaggedRing": "Ring 017",
  "reasons": [
    "Hardware device Device-17 shared across 14 distinct customer profiles",
    "Recycled prepaid payment instrument Instrument-4",
    "Sub-₹50,000 KYC structuring velocity pattern detected"
  ],
  "latencyMs": 18
}`;

  const faqs = [
    {
      q: "Why not just rely on standard payment gateway fraud filters?",
      a: "Standard gateway fraud engines evaluate transactions in isolation (e.g. checking whether a single card is stolen). Organized fraud gangs bypass these by creating dozens of clean synthetic identities, using different burner cards and disposable SIMs. Rixor connects the invisible topological dots (shared hardware fingerprints, proxy subnets, co-occurrence timing) to detect the coordinated syndicate before authorization."
    },
    {
      q: "How does Rixor prevent target data leakage during ML evaluation?",
      a: "Traditional models randomly split transaction rows (80/20 train/test), which causes massive data leakage because transactions from the same fraud ring exist in both sets. Rixor enforces a zero-leakage 'Held-Out Ring Split' protocol: 15 complete fraud rings (Rings 086–100 comprising 5,000 transactions) were completely quarantined from model training and feature compilation."
    },
    {
      q: "What is the Interactive Financial Cost Frontier Curve?",
      a: "In real-world fraud prevention, accuracy alone is meaningless because false-positives create customer insult and lost checkout margin, while false-negatives result in chargebacks. Rixor's Cost Frontier plots Total Business Cost = (False Negatives × ₹1,200 Chargeback Cost) + (False Positives × ₹180 Verification Friction) across all threshold variations to find the mathematically optimal operating threshold."
    },
    {
      q: "How does the One-Click Cyber Cell Dossier Exporter work?",
      a: "When an analyst blocks a syndicate, clicking 'Export Cyber Cell Dossier' instantly compiles a cryptographically signed JSON/CSV incident audit package. It includes an ISO timestamped event chain, hardware MAC/canvas signatures, IP proxy ASNs, and a SHA-256 integrity hash ready to submit directly to India's National Cyber Crime Reporting Portal (1930 helpline) and card-issuing banks."
    },
    {
      q: "Can Rixor handle high-throughput Indian payment gateways (Razorpay, Cashfree, PayU, PhonePe)?",
      a: "Yes. Rixor's ingestion endpoint executes graph lookups and ensemble inference in sub-25ms. For peak checkout volumes (such as Diwali flash sales), graph updates can be dispatched asynchronously while cached entity degree centrality scores provide instantaneous synchronous routing."
    },
    {
      q: "What is the difference between HOLD and BLOCK actions?",
      a: "A BLOCK action rejects the payment immediately at the gateway and blacklists originating hardware hashes. A HOLD action authorizes the payment into a 24-hour escrow quarantine, delaying settlement or merchant fulfillment while giving analysts time to verify identity or request video KYC."
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    !searchQuery || 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      {/* 1. Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <InfoTooltip
            title="System Documentation"
            content="Official operational manuals, API integration blueprints, troubleshooting workflows, and technical FAQs for Rixor's Sybil defense framework."
            position="top"
            maxWidth="max-w-md"
          >
            <h2 
              className="text-2xl font-bold text-[#192837] tracking-tight flex items-center gap-2.5 cursor-help"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <BookOpen size={24} className="text-[#7342E2]" />
              <span>Documentation, Guides & System FAQs</span>
            </h2>
          </InfoTooltip>
          <p className="text-xs text-[#192837]/75 mt-1">
            Complete technical walkthrough, REST API implementation guides, operational troubleshooting playbooks, and security FAQs.
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#192837]/40" />
          <input
            type="text"
            placeholder="Search guides, APIs, FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-[#192837]/15 text-xs text-[#192837] placeholder:text-[#192837]/40 focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
          />
        </div>
      </div>

      {/* 2. Category Switcher Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#192837]/10 text-xs font-semibold">
        <button
          onClick={() => setActiveCategory('walkthrough')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'walkthrough'
              ? 'bg-[#7342E2] text-white shadow-xs font-bold'
              : 'bg-white text-[#192837]/70 hover:text-[#192837] border border-[#192837]/10'
          }`}
        >
          <Layers size={14} />
          <span>1. Project Walkthrough & Architecture</span>
        </button>

        <button
          onClick={() => setActiveCategory('guides')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'guides'
              ? 'bg-[#7342E2] text-white shadow-xs font-bold'
              : 'bg-white text-[#192837]/70 hover:text-[#192837] border border-[#192837]/10'
          }`}
        >
          <Terminal size={14} />
          <span>2. How-To Guides & API Examples</span>
        </button>

        <button
          onClick={() => setActiveCategory('troubleshooting')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'troubleshooting'
              ? 'bg-[#7342E2] text-white shadow-xs font-bold'
              : 'bg-white text-[#192837]/70 hover:text-[#192837] border border-[#192837]/10'
          }`}
        >
          <AlertTriangle size={14} />
          <span>3. Troubleshooting Playbook</span>
        </button>

        <button
          onClick={() => setActiveCategory('faqs')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeCategory === 'faqs'
              ? 'bg-[#7342E2] text-white shadow-xs font-bold'
              : 'bg-white text-[#192837]/70 hover:text-[#192837] border border-[#192837]/10'
          }`}
        >
          <HelpCircle size={14} />
          <span>4. System FAQs</span>
        </button>
      </div>

      {/* 3. Category 1: Walkthrough & Architecture */}
      {activeCategory === 'walkthrough' && (
        <div className="space-y-8 animate-fade-in">
          {/* Layman Overview Banner */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#7342E2]/10 flex items-center justify-center text-[#7342E2]">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#192837]" style={{ fontFamily: 'var(--font-heading)' }}>
                  The Plain-English Explanation: What is Rixor?
                </h3>
                <span className="text-xs text-[#192837]/60">Everyday intuition for non-technical stakeholders</span>
              </div>
            </div>

            <p className="text-sm text-[#192837]/85 leading-relaxed font-medium">
              Imagine an organized criminal gang wanting to steal expensive smartphones or gift cards from an Indian e-commerce platform. If they use one person and one credit card, the store catches them immediately. So, the gang creates <strong>50 fake accounts</strong> with different names, addresses, and phone numbers. To any normal security system, these look like 50 random everyday shoppers.
            </p>

            <div className="p-4 rounded-2xl bg-[#F2F2EE] border border-[#192837]/10 text-xs text-[#192837]/80 font-medium">
              <strong className="text-[#7342E2]">Rixor is an AI security guard that connects the hidden dots:</strong> It notices that 14 of those accounts were opened from the very same laptop, 8 are recycling the same virtual prepaid card, and 20 are shipping to drop addresses within 500 meters of each other in Bengaluru. Before a single order is approved or shipped, Rixor exposes the entire spiderweb and freezes the gang at once.
            </div>
          </div>

          {/* 4-Tier Architecture Deep Dive */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#192837]" style={{ fontFamily: 'var(--font-heading)' }}>
                  Core System Architecture (4-Tier Defensive Engine)
                </h3>
                <p className="text-xs text-[#192837]/70 mt-0.5">
                  End-to-end telemetry pipeline from payment gateway ingestion to real-time graph containment.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                Sub-25ms P99 Latency
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#7342E2] uppercase tracking-wider">Tier 1</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[#192837]/70 font-mono text-[10px]">REST</span>
                </div>
                <h4 className="font-bold text-[#192837] text-sm">Ingestion Gateway</h4>
                <p className="text-xs text-[#192837]/70 leading-relaxed">
                  Accepts JSON payloads via <code>/api/transactions/ingest</code> with hardware fingerprints, IP ASNs, card hashes, and amount (₹).
                </p>
                <div className="text-[11px] font-mono text-[#7342E2]">~4ms ingest</div>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-rose-600 uppercase tracking-wider">Tier 2</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[#192837]/70 font-mono text-[10px]">Graph</span>
                </div>
                <h4 className="font-bold text-[#192837] text-sm">Graph Topology</h4>
                <p className="text-xs text-[#192837]/70 leading-relaxed">
                  NetworkX bipartite projection maps entity co-occurrence: customer ↔ device ↔ payment card ↔ drop address.
                </p>
                <div className="text-[11px] font-mono text-rose-600">~8ms traversal</div>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-amber-600 uppercase tracking-wider">Tier 3</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[#192837]/70 font-mono text-[10px]">XGBoost</span>
                </div>
                <h4 className="font-bold text-[#192837] text-sm">Ensemble Scoring</h4>
                <p className="text-xs text-[#192837]/70 leading-relaxed">
                  Calculates composite risk: 40% Supervised ML, 35% Graph Centrality, 15% Velocity Bursts, 10% Regulatory Rules.
                </p>
                <div className="text-[11px] font-mono text-amber-600">~6ms inference</div>
              </div>

              {/* Step 4 */}
              <div className="p-5 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-700 uppercase tracking-wider">Tier 4</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-[#192837]/70 font-mono text-[10px]">Action</span>
                </div>
                <h4 className="font-bold text-[#192837] text-sm">Defensive Routing</h4>
                <p className="text-xs text-[#192837]/70 leading-relaxed">
                  Routes transaction to APPROVE, REVIEW (OTP), HOLD (24h Escrow), or BLOCK (Gateway rejection + 1930 Dossier).
                </p>
                <div className="text-[11px] font-mono text-emerald-700">Instant routing</div>
              </div>
            </div>
          </div>

          {/* Quick Page Navigator Bento */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
            <h3 className="text-lg font-bold text-[#192837]" style={{ fontFamily: 'var(--font-heading)' }}>
              Console Module Directory: Where to Find Everything
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { page: 'overview' as const, title: 'Overview', desc: 'Live payments stream, syndicate alerts & KPI tiles' },
                { page: 'ring-explorer' as const, title: 'Ring Explorer', desc: 'Interactive physics node map of Ring 017' },
                { page: 'cases' as const, title: 'Cases', desc: 'Triage terminal & Cyber Cell Dossier export' },
                { page: 'evaluation' as const, title: 'Evaluation', desc: 'Held-out test set & Cost Frontier Curve' },
                { page: 'policy' as const, title: 'Policy', desc: 'Threshold sliders & live payload sandbox' },
              ].map(item => (
                <button
                  key={item.page}
                  onClick={() => onNavigatePage(item.page)}
                  className="p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 hover:border-[#7342E2] hover:bg-white transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between font-bold text-xs text-[#192837] mb-1">
                    <span>{item.title}</span>
                    <ArrowUpRight size={14} className="text-[#7342E2] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <p className="text-[11px] text-[#192837]/70 leading-snug">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Category 2: How-To Guides & Code Examples */}
      {activeCategory === 'guides' && (
        <div className="space-y-8 animate-fade-in">
          {/* Guide 1: Ingest Transaction via REST API */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-[#7342E2] uppercase tracking-wider">How-To Guide 01</span>
                <h3 className="text-lg font-bold text-[#192837] mt-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
                  Ingest Real-Time Payment Payloads (REST Webhook)
                </h3>
                <p className="text-xs text-[#192837]/70 mt-0.5">
                  Point your payment gateway webhook (Razorpay, Cashfree, Stripe) to Rixor's evaluation endpoint.
                </p>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center gap-1 bg-[#F2F2EE] p-1 rounded-xl border border-[#192837]/10 text-xs font-semibold">
                <button
                  onClick={() => setCodeLanguage('curl')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    codeLanguage === 'curl' ? 'bg-white text-[#192837] shadow-xs' : 'text-[#192837]/60'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setCodeLanguage('python')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    codeLanguage === 'python' ? 'bg-white text-[#192837] shadow-xs' : 'text-[#192837]/60'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setCodeLanguage('javascript')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    codeLanguage === 'javascript' ? 'bg-white text-[#192837] shadow-xs' : 'text-[#192837]/60'
                  }`}
                >
                  Node.js
                </button>
              </div>
            </div>

            {/* Code Snippet Box */}
            <div className="relative rounded-2xl bg-[#192837] text-white p-4 font-mono text-xs overflow-x-auto shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 text-[11px] text-white/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>POST /api/transactions/ingest</span>
                </div>
                <button
                  onClick={() => handleCopy(
                    codeLanguage === 'curl' ? curlExample : codeLanguage === 'python' ? pythonExample : jsExample,
                    'code-example'
                  )}
                  className="flex items-center gap-1 text-white/80 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedKey === 'code-example' ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="pt-3 text-xs text-emerald-300 leading-relaxed whitespace-pre-wrap">
                {codeLanguage === 'curl' ? curlExample : codeLanguage === 'python' ? pythonExample : jsExample}
              </pre>
            </div>

            {/* Response Payload Box */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#192837]">Synchronous Response (Returned in &lt;25ms):</span>
              <div className="rounded-2xl bg-[#F2F2EE] border border-[#192837]/10 p-4 font-mono text-xs text-[#192837] overflow-x-auto">
                <pre className="text-xs text-[#192837]/90 leading-relaxed whitespace-pre-wrap">
                  {responseExample}
                </pre>
              </div>
            </div>

            {/* In-Console Testing Action */}
            <div className="flex items-center justify-between pt-2 border-t border-[#192837]/10">
              <span className="text-xs text-[#192837]/75">
                Want to test this live right now from your browser?
              </span>
              <button
                onClick={() => {
                  if (onSendTestWebhookTx) onSendTestWebhookTx();
                }}
                className="px-4 py-2 rounded-xl bg-[#7342E2] hover:brightness-110 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Zap size={14} />
                <span>Fire Test Webhook Payload</span>
              </button>
            </div>
          </div>

          {/* Guide 2: How to Export Cyber Cell Dossier */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">How-To Guide 02</span>
            <h3 className="text-lg font-bold text-[#192837]" style={{ fontFamily: 'var(--font-heading)' }}>
              Export an Official 1930 Cyber Cell & Chargeback Evidence Dossier
            </h3>
            <p className="text-xs text-[#192837]/75 leading-relaxed">
              When dealing with coordinated financial crime, traditional PDF screenshots get rejected by law enforcement and acquiring banks. Rixor compiles a cryptographically verifiable JSON dossier.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 space-y-1.5">
                <span className="text-xs font-bold text-[#192837] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#7342E2] text-white flex items-center justify-center text-[10px]">1</span>
                  Select the Incident Case
                </span>
                <p className="text-xs text-[#192837]/70">
                  Navigate to the <strong>Cases</strong> tab and select the targeted high-risk case (e.g. CASE-8891).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 space-y-1.5">
                <span className="text-xs font-bold text-[#192837] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#7342E2] text-white flex items-center justify-center text-[10px]">2</span>
                  Click "Export Dossier"
                </span>
                <p className="text-xs text-[#192837]/70">
                  Click the <strong>Export Cyber Cell Dossier</strong> button in the case header. A download will begin automatically.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 space-y-1.5">
                <span className="text-xs font-bold text-[#192837] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#7342E2] text-white flex items-center justify-center text-[10px]">3</span>
                  Submit to 1930 / Bank
                </span>
                <p className="text-xs text-[#192837]/70">
                  Upload the file directly to India's 1930 Cyber Crime portal with its SHA-256 evidence verification chain.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onNavigatePage('cases')}
                className="px-4 py-2 rounded-xl bg-[#F2F2EE] hover:bg-[#192837]/10 text-[#192837] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Jump to Cases Tab to Try It</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Category 3: Troubleshooting Playbook */}
      {activeCategory === 'troubleshooting' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-3">
            <h3 className="text-lg font-bold text-[#192837]" style={{ fontFamily: 'var(--font-heading)' }}>
              Operational Troubleshooting Playbook
            </h3>
            <p className="text-xs text-[#192837]/70">
              Immediate diagnostic procedures and solutions for edge cases encountered during live production traffic.
            </p>
          </div>

          <div className="space-y-4">
            {/* Issue 1 */}
            <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle size={17} />
                <span>Issue 01: High False-Positive Step-Up Volume During Festive Flash Sales (Diwali / Big Billion Days)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#192837]/80">
                <div className="p-3.5 rounded-xl bg-[#F2F2EE]">
                  <strong className="block text-[#192837] mb-1">Root Cause:</strong>
                  Surging checkout velocities trigger the 10-minute velocity threshold (15% weight), causing genuine buyers to face step-up OTP prompts.
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <strong className="block text-emerald-950 mb-1">Recommended Solution:</strong>
                  Go to the <strong>Policy</strong> tab. Temporarily adjust the <strong>Review Threshold</strong> from 0.70 to 0.78, or whitelist trusted loyalty members with accounts &gt;90 days old.
                </div>
              </div>
            </div>

            {/* Issue 2 */}
            <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                <AlertTriangle size={17} />
                <span>Issue 02: Legitimate Users on Corporate VPNs or University Campuses Flagged</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#192837]/80">
                <div className="p-3.5 rounded-xl bg-[#F2F2EE]">
                  <strong className="block text-[#192837] mb-1">Root Cause:</strong>
                  Dozens of distinct employees or students share a single public IPv4 gateway, appearing as a shared IP node in the bipartite graph.
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <strong className="block text-emerald-950 mb-1">Recommended Solution:</strong>
                  Rixor's bipartite model never blocks on IP address alone. Verify that hardware fingerprints and payment instruments are distinct. The graph engine assigns low weight to IP nodes that match recognized corporate ASN CIDR blocks.
                </div>
              </div>
            </div>

            {/* Issue 3 */}
            <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                <AlertTriangle size={17} />
                <span>Issue 03: Live SSE Telemetry Stream Connection Dropped or Delayed</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#192837]/80">
                <div className="p-3.5 rounded-xl bg-[#F2F2EE]">
                  <strong className="block text-[#192837] mb-1">Root Cause:</strong>
                  Enterprise network proxies with aggressive HTTP keep-alive timeouts closing the Server-Sent Events socket connection.
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <strong className="block text-emerald-950 mb-1">Recommended Solution:</strong>
                  The client console automatically falls back to 5-second polling if SSE fails. Click the <strong>Live Streaming</strong> toggle in the Overview tab to re-initialize the real-time websocket heartbeat.
                </div>
              </div>
            </div>

            {/* Issue 4 */}
            <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                <AlertTriangle size={17} />
                <span>Issue 04: Privacy Browsers (Brave / Safari ITP) Randomizing Hardware Fingerprints</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#192837]/80">
                <div className="p-3.5 rounded-xl bg-[#F2F2EE]">
                  <strong className="block text-[#192837] mb-1">Root Cause:</strong>
                  Canvas and audio context fingerprint randomization prevents deterministic device ID generation for privacy-focused shoppers.
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <strong className="block text-emerald-950 mb-1">Recommended Solution:</strong>
                  Rixor's multi-entity model smoothly shifts weighting: when hardware confidence is low, the graph topology prioritizes card BIN co-occurrence, delivery geohash clustering, and typing cadences.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Category 4: System FAQs */}
      {activeCategory === 'faqs' && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-2">
            <h3 className="text-lg font-bold text-[#192837]" style={{ fontFamily: 'var(--font-heading)' }}>
              Frequently Asked Technical & Business Questions
            </h3>
            <p className="text-xs text-[#192837]/70">
              Clear answers to the most common questions asked by fraud risk managers, data scientists, and engineers.
            </p>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, index) => {
              const isExpanded = expandedFaq === index;
              return (
                <div 
                  key={index}
                  className="rounded-2xl bg-white border border-[#192837]/10 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isExpanded ? null : index)}
                    className="w-full px-6 py-4.5 text-left font-bold text-xs sm:text-sm text-[#192837] flex items-center justify-between gap-4 hover:bg-[#F2F2EE]/50 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5">
                      <HelpCircle size={17} className="text-[#7342E2] shrink-0" />
                      <span>{faq.q}</span>
                    </span>
                    <span className={`text-xs text-[#192837]/40 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="px-6 pb-5 pt-1 text-xs text-[#192837]/80 leading-relaxed border-t border-[#192837]/5 bg-[#F2F2EE]/30">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
