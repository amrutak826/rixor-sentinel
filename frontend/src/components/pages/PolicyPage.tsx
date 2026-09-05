import { useState } from 'react';
import { PolicyConfig, RecommendedAction } from '../../types';
import { InfoTooltip } from '../InfoTooltip';
import { 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  Ban, 
  PauseCircle, 
  CheckCircle, 
  Play, 
  RotateCcw, 
  Save, 
  Zap, 
  Layers 
} from 'lucide-react';

interface PolicyPageProps {
  policy: PolicyConfig;
  onUpdatePolicy: (updated: PolicyConfig) => void;
}

export function PolicyPage({ policy, onUpdatePolicy }: PolicyPageProps) {
  const [reviewThreshold, setReviewThreshold] = useState(policy.reviewThreshold);
  const [holdThreshold, setHoldThreshold] = useState(policy.holdThreshold);
  const [blockThreshold, setBlockThreshold] = useState(policy.blockThreshold);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Live Sandbox Testing State
  const [simCustomer, setSimCustomer] = useState('C107');
  const [simDevice, setSimDevice] = useState('Device-17');
  const [simInstrument, setSimInstrument] = useState('Instrument-4');
  const [simIP, setSimIP] = useState('IP-07');
  const [simAddress, setSimAddress] = useState('Address-12');
  const [simMerchant, setSimMerchant] = useState('QuickPerks GiftCards India');
  const [simAmountINR, setSimAmountINR] = useState(47178); // ~500 USD in INR
  const [simVelocity, setSimVelocity] = useState(14); // tx / hour
  const [simResult, setSimResult] = useState<{
    score: number;
    action: RecommendedAction;
    mlContrib: number;
    graphContrib: number;
    ruleHits: string[];
  } | null>(null);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleSave = () => {
    onUpdatePolicy({
      ...policy,
      reviewThreshold,
      holdThreshold,
      blockThreshold,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleRunSimulation = () => {
    // Deterministic simulation calculation based on graph overlaps
    let graphOverlapScore = 0.2;
    const ruleHits: string[] = [];

    if (simDevice === 'Device-17') {
      graphOverlapScore += 0.42;
      ruleHits.push('Shared Hardware Fingerprint (14 accounts on Device-17)');
    }
    if (simInstrument === 'Instrument-4' || simInstrument === 'Instrument-5') {
      graphOverlapScore += 0.28;
      ruleHits.push('High-Velocity Recycled Virtual PAN');
    }
    if (simIP === 'IP-07' || simIP === 'IP-08') {
      graphOverlapScore += 0.15;
      ruleHits.push('Tor / Datacenter VPN Proxy Gateway');
    }
    if (simAmountINR >= 46000 && simAmountINR <= 49999) {
      graphOverlapScore += 0.10;
      ruleHits.push('Sub-₹50,000 Structuring Pattern');
    }
    if (simVelocity > 10) {
      graphOverlapScore += 0.12;
      ruleHits.push(`Velocity Burst: ${simVelocity} tx/hr exceeds threshold (12/hr)`);
    }

    const finalScore = Math.min(0.99, Math.max(0.05, graphOverlapScore));
    let action: RecommendedAction = 'ALLOW';
    if (finalScore >= blockThreshold) {
      action = 'BLOCK';
    } else if (finalScore >= holdThreshold) {
      action = 'HOLD';
    } else if (finalScore >= reviewThreshold) {
      action = 'REVIEW';
    }

    setSimResult({
      score: finalScore,
      action,
      mlContrib: Math.round(finalScore * 0.40 * 100) / 100,
      graphContrib: Math.round(finalScore * 0.35 * 100) / 100,
      ruleHits,
    });
  };

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      {/* 1. Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <InfoTooltip
            title="Policy Configuration & Threshold Tuning"
            content="Allows risk teams to drag sliders to decide when to automatically block suspicious payments, when to hold them for an OTP check, and when to let them pass smoothly."
            position="top"
            maxWidth="max-w-md"
          >
            <h2 
              className="text-2xl font-bold text-[#192837] tracking-tight flex items-center gap-2.5 cursor-help"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <Sliders size={24} className="text-[#7342E2]" />
              <span>Policy Configuration & Threshold Tuning</span>
            </h2>
          </InfoTooltip>
          <p className="text-xs text-[#192837]/75 mt-1">
            Calibrate review, hold, and block thresholds to balance customer conversion against syndicate fraud prevention.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setReviewThreshold(0.70);
              setHoldThreshold(0.85);
              setBlockThreshold(0.90);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#F2F2EE] hover:bg-[#192837]/10 text-[#192837] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-[#7342E2] hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Save size={14} />
            <span>{savedSuccess ? 'Policy Saved!' : 'Apply Policy v3.2'}</span>
          </button>
        </div>
      </div>

      {/* 2. Three Threshold Cards (Prompt: showcase review threshold, hold threshold, block threshold) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Review Threshold */}
        <InfoTooltip
          title="Review Threshold (Step-Up Verification)"
          content="Transactions scoring above this boundary require an OTP or passkey challenge. Users who authenticate successfully proceed without disruption."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4 hover:border-blue-400/40 transition-all cursor-help">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                <CheckCircle size={16} />
                <span>Review Threshold</span>
              </span>
              <span className="text-2xl font-mono font-bold text-blue-800">
                {reviewThreshold.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-[#192837]/75 leading-relaxed font-medium">
              Scores between <strong>{reviewThreshold.toFixed(2)}</strong> and <strong>{holdThreshold.toFixed(2)}</strong> trigger step-up biometric passkey or SMS challenge without failing the authorization.
            </p>

            <div>
              <div className="flex justify-between text-xs text-[#192837]/60 font-mono mb-1">
                <span>0.50</span>
                <span className="font-bold text-blue-700">{reviewThreshold.toFixed(2)}</span>
                <span>0.80</span>
              </div>
              <input
                type="range"
                min={0.50}
                max={0.80}
                step={0.01}
                value={reviewThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setReviewThreshold(val);
                  if (val >= holdThreshold) setHoldThreshold(Number((val + 0.05).toFixed(2)));
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 text-[11px] text-[#192837]/60 border-t border-[#192837]/10">
              Action: <strong>REVIEW</strong> • Estimated daily volume: 42 tx
            </div>
          </div>
        </InfoTooltip>

        {/* Hold Threshold */}
        <InfoTooltip
          title="Hold Threshold (Escrow Quarantine)"
          content="High-risk transactions quarantined for 24 hours. Payout is temporarily paused so an analyst can review graph linkages."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4 hover:border-amber-400/40 transition-all cursor-help">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                <PauseCircle size={16} />
                <span>Hold Threshold</span>
              </span>
              <span className="text-2xl font-mono font-bold text-amber-800">
                {holdThreshold.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-[#192837]/75 leading-relaxed font-medium">
              Scores between <strong>{holdThreshold.toFixed(2)}</strong> and <strong>{blockThreshold.toFixed(2)}</strong> route to an escrow hold. Payout delayed up to 24 hours for manual review.
            </p>

            <div>
              <div className="flex justify-between text-xs text-[#192837]/60 font-mono mb-1">
                <span>0.70</span>
                <span className="font-bold text-amber-700">{holdThreshold.toFixed(2)}</span>
                <span>0.95</span>
              </div>
              <input
                type="range"
                min={0.70}
                max={0.95}
                step={0.01}
                value={holdThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setHoldThreshold(val);
                  if (val <= reviewThreshold) setReviewThreshold(Number((val - 0.05).toFixed(2)));
                  if (val >= blockThreshold) setBlockThreshold(Number((val + 0.05).toFixed(2)));
                }}
                className="w-full accent-amber-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 text-[11px] text-[#192837]/60 border-t border-[#192837]/10">
              Action: <strong>HOLD</strong> • 24h Escrow Quarantine
            </div>
          </div>
        </InfoTooltip>

        {/* Block Threshold */}
        <InfoTooltip
          title="Block Threshold (Immediate Gateway Interception)"
          content="Extreme risk transactions rejected instantly at the gateway level. All linked cards and hardware fingerprints are added to the active containment blacklist."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4 hover:border-rose-400/40 transition-all cursor-help">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                <Ban size={16} />
                <span>Block Threshold</span>
              </span>
              <span className="text-2xl font-mono font-bold text-rose-800">
                {blockThreshold.toFixed(2)}
              </span>
            </div>

            <p className="text-xs text-[#192837]/75 leading-relaxed font-medium">
              Scores <strong>≥ {blockThreshold.toFixed(2)}</strong> automatically reject the transaction and blacklist the originating device fingerprint and IP proxy range.
            </p>

            <div>
              <div className="flex justify-between text-xs text-[#192837]/60 font-mono mb-1">
                <span>0.80</span>
                <span className="font-bold text-rose-700">{blockThreshold.toFixed(2)}</span>
                <span>0.98</span>
              </div>
              <input
                type="range"
                min={0.80}
                max={0.98}
                step={0.01}
                value={blockThreshold}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBlockThreshold(val);
                  if (val <= holdThreshold) setHoldThreshold(Number((val - 0.05).toFixed(2)));
                }}
                className="w-full accent-rose-600 cursor-pointer"
              />
            </div>

            <div className="pt-2 text-[11px] text-[#192837]/60 border-t border-[#192837]/10">
              Action: <strong>BLOCK</strong> • Real-time Gateway Rejection
            </div>
          </div>
        </InfoTooltip>
      </div>

      {/* 3. Component Weights Breakdown */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#192837]/10">
          <div>
            <h3 
              className="text-lg font-bold text-[#192837]"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Multi-Layer Risk Scoring Weights
            </h3>
            <p className="text-xs text-[#192837]/70 mt-0.5">
              Composite score calculated per authorization across 4 analytical dimensions.
            </p>
          </div>
          <span className="text-xs font-bold text-[#7342E2] bg-[#7342E2]/10 px-3 py-1 rounded-full">
            Total: 100%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
          <InfoTooltip
            title="Supervised Machine Learning (40%)"
            content="Gradient-boosted decision trees (XGBoost) trained on behavioral signals, historical dispute records, and payment velocity curves."
            position="top"
            className="w-full block"
            maxWidth="max-w-xs"
          >
            <div className="p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 hover:border-[#7342E2]/30 transition-all cursor-help">
              <span className="text-xs font-bold text-[#192837] block">Supervised ML</span>
              <span className="text-2xl font-mono font-bold text-[#7342E2] mt-1 block">40%</span>
              <p className="text-[11px] text-[#192837]/70 mt-1">XGBoost transaction behavioral features</p>
            </div>
          </InfoTooltip>

          <InfoTooltip
            title="Graph Centrality & Topology (35%)"
            content="NetworkX bipartite graph algorithm calculating degree centrality, shared hardware hashes, and recycled payment instrument clusters."
            position="top"
            className="w-full block"
            maxWidth="max-w-xs"
          >
            <div className="p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 hover:border-[#7342E2]/30 transition-all cursor-help">
              <span className="text-xs font-bold text-[#192837] block">Graph Centrality</span>
              <span className="text-2xl font-mono font-bold text-rose-600 mt-1 block">35%</span>
              <p className="text-[11px] text-[#192837]/70 mt-1">Bipartite Sybil clustering & device reuse</p>
            </div>
          </InfoTooltip>

          <InfoTooltip
            title="Velocity Bursts (15%)"
            content="High-frequency authorization surges measured across rolling 10-minute and 1-hour temporal sliding windows."
            position="top"
            className="w-full block"
            maxWidth="max-w-xs"
          >
            <div className="p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 hover:border-[#7342E2]/30 transition-all cursor-help">
              <span className="text-xs font-bold text-[#192837] block">Velocity Bursts</span>
              <span className="text-2xl font-mono font-bold text-amber-600 mt-1 block">15%</span>
              <p className="text-[11px] text-[#192837]/70 mt-1">10-minute and 1-hour transaction frequency</p>
            </div>
          </InfoTooltip>

          <InfoTooltip
            title="Deterministic Rules (10%)"
            content="Regulatory triggers such as sub-₹50,000 KYC structuring, Tor exit relay nodes, and disposable burner BIN cards."
            position="top"
            className="w-full block"
            maxWidth="max-w-xs"
          >
            <div className="p-4 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 hover:border-[#7342E2]/30 transition-all cursor-help">
              <span className="text-xs font-bold text-[#192837] block">Deterministic Rules</span>
              <span className="text-2xl font-mono font-bold text-slate-700 mt-1 block">10%</span>
              <p className="text-[11px] text-[#192837]/70 mt-1">Tor ASN, known burner BINs, country mismatch</p>
            </div>
          </InfoTooltip>
        </div>
      </div>

      {/* 4. Live Transaction Policy Sandbox Simulation */}
      {/* Prompt: "improvise it and replace $ symbol with ₹ and convert usd into rupees 1$=94.45 ₹ and add more customers, devices, instruments,ip proxies,addresses, merchants" */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#192837]/10">
          <div>
            <InfoTooltip
              title="Live Policy Scoring Sandbox"
              content="Interactive test environment to simulate live transaction payloads, test graph overlap contribution, and verify action threshold boundaries."
              position="top"
              maxWidth="max-w-md"
            >
              <h3 
                className="text-lg font-bold text-[#192837] flex items-center gap-2 cursor-help"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <Zap size={20} className="text-[#7342E2]" />
                <span>Live Policy Scoring Sandbox</span>
              </h3>
            </InfoTooltip>
            <p className="text-xs text-[#192837]/70 mt-0.5">
              Simulate an incoming transaction payload with multi-entity attributes to test real-time threshold routing.
            </p>
          </div>

          <button
            onClick={handleRunSimulation}
            className="px-4 py-2.5 rounded-xl bg-[#7342E2] hover:brightness-110 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Play size={14} />
            <span>Score Simulated Transaction</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs">
          {/* Customer */}
          <div>
            <label className="block font-semibold text-[#192837] mb-1">Customer</label>
            <select
              value={simCustomer}
              onChange={(e) => setSimCustomer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2EE] border border-[#192837]/15 text-[#192837] focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
            >
              <option value="C107">C107 (Alex V. - Flagged Ring 17)</option>
              <option value="C101">C101 (Elena R. - Flagged Ring 17)</option>
              <option value="C115">C115 (Rohan M. - Flagged Ring 24)</option>
              <option value="C118">C118 (Meera D. - Flagged Ring 12)</option>
              <option value="C-Norm-88">C-Norm-88 (Standard Verified User)</option>
            </select>
          </div>

          {/* Device */}
          <div>
            <label className="block font-semibold text-[#192837] mb-1">Device Fingerprint</label>
            <select
              value={simDevice}
              onChange={(e) => setSimDevice(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2EE] border border-[#192837]/15 text-[#192837] focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
            >
              <option value="Device-17">Device-17 (Shared by 14 accounts)</option>
              <option value="Device-22">Device-22 (Automated Headless)</option>
              <option value="Device-09">Device-09 (Android Bluestacks)</option>
              <option value="Device-31">Device-31 (Linux Botnet Server)</option>
              <option value="Dev-Regular-11">Dev-Regular-11 (Single User iPhone)</option>
            </select>
          </div>

          {/* Payment Instrument */}
          <div>
            <label className="block font-semibold text-[#192837] mb-1">Payment Instrument</label>
            <select
              value={simInstrument}
              onChange={(e) => setSimInstrument(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2EE] border border-[#192837]/15 text-[#192837] focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
            >
              <option value="Instrument-4">Instrument-4 (Visa 8812 - Virtual)</option>
              <option value="Instrument-5">Instrument-5 (Mastercard 4409 - Revolut)</option>
              <option value="Instrument-8">Instrument-8 (PayTM Prepaid Wallet)</option>
              <option value="Card-Prime-9">Card-Prime-9 (HDFC Verified Card)</option>
            </select>
          </div>

          {/* IP Proxy */}
          <div>
            <label className="block font-semibold text-[#192837] mb-1">IP Connection</label>
            <select
              value={simIP}
              onChange={(e) => setSimIP(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2EE] border border-[#192837]/15 text-[#192837] focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
            >
              <option value="IP-07">IP-07 (Datacenter VPN Mumbai)</option>
              <option value="IP-08">IP-08 (Tor Exit Relay Node #41)</option>
              <option value="IP-14">IP-14 (Residential Proxy Mesh)</option>
              <option value="IP-Residential-3">IP-Residential-3 (Airtel Broadband)</option>
            </select>
          </div>

          {/* Address */}
          <div>
            <label className="block font-semibold text-[#192837] mb-1">Billing Address</label>
            <select
              value={simAddress}
              onChange={(e) => setSimAddress(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2EE] border border-[#192837]/15 text-[#192837] focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
            >
              <option value="Address-12">Address-12 (Evergreen Terrace, Bengaluru)</option>
              <option value="Address-13">Address-13 (Cache Road Mail Drop, Mumbai)</option>
              <option value="Address-15">Address-15 (Freight Yard, Hyderabad)</option>
              <option value="Addr-Residential-5">Addr-Residential-5 (Verified Home)</option>
            </select>
          </div>

          {/* Merchant */}
          <div>
            <label className="block font-semibold text-[#192837] mb-1">Target Merchant</label>
            <select
              value={simMerchant}
              onChange={(e) => setSimMerchant(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2EE] border border-[#192837]/15 text-[#192837] focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
            >
              <option value="QuickPerks GiftCards India">QuickPerks GiftCards India</option>
              <option value="ByteWave Cloud Credits">ByteWave Cloud Credits</option>
              <option value="Nova Crypto Remit Gateway">Nova Crypto Remit Gateway</option>
              <option value="Apex Electronics Express">Apex Electronics Express</option>
            </select>
          </div>

          {/* Amount in INR */}
          <div>
            <label className="block font-semibold text-[#192837] mb-1">Amount (₹)</label>
            <input
              type="number"
              value={simAmountINR}
              onChange={(e) => setSimAmountINR(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2EE] border border-[#192837]/15 text-[#192837] font-mono focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
            />
          </div>

          {/* Velocity */}
          <div>
            <label className="block font-semibold text-[#192837] mb-1">Velocity (tx/hr)</label>
            <input
              type="number"
              value={simVelocity}
              onChange={(e) => setSimVelocity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl bg-[#F2F2EE] border border-[#192837]/15 text-[#192837] font-mono focus:outline-none focus:ring-1 focus:ring-[#7342E2]"
            />
          </div>
        </div>

        {/* Simulation Output Card */}
        {simResult && (
          <div className="p-5 rounded-2xl bg-[#F2F2EE]/70 border border-[#192837]/10 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm text-[#192837]">
                  Simulation Verdict:
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  simResult.action === 'BLOCK'
                    ? 'bg-rose-100 text-rose-700 border border-rose-300'
                    : simResult.action === 'HOLD'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : simResult.action === 'REVIEW'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {simResult.action}
                </span>
                <span className="font-mono text-sm font-bold text-[#192837]">
                  Score: {Math.round(simResult.score * 100)}%
                </span>
              </div>

              {simResult.ruleHits.length > 0 && (
                <div className="mt-2 space-y-1 text-[11px] text-[#192837]/80">
                  <span className="font-semibold text-rose-700 block">Triggered Signals:</span>
                  {simResult.ruleHits.map((hit, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-rose-500">•</span>
                      <span>{hit}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-right font-mono text-[11px] text-[#192837]/70">
              <div>ML Contribution: +{simResult.mlContrib}</div>
              <div>Graph Overlap: +{simResult.graphContrib}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
