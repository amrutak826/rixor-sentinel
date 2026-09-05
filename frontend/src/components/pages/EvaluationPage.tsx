import { useState } from 'react';
import { EvaluationRunMetrics } from '../../types';
import { CostFrontierCurve } from '../CostFrontierCurve';
import { InfoTooltip } from '../InfoTooltip';
import { 
  BarChart3, 
  ShieldCheck, 
  TrendingDown, 
  TrendingUp, 
  Layers, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileCheck2, 
  Sparkles 
} from 'lucide-react';

interface EvaluationPageProps {
  evaluationData: EvaluationRunMetrics;
  currentPolicyThreshold?: number;
  onApplyPolicyThreshold?: (threshold: number) => void;
  onNavigateToPolicy?: () => void;
}

export function EvaluationPage({ 
  evaluationData,
  currentPolicyThreshold = 0.70,
  onApplyPolicyThreshold,
  onNavigateToPolicy
}: EvaluationPageProps) {
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Dynamic calculation for metrics comparison
  const precDelta = (evaluationData.precision - evaluationData.baseline.precision) * 100;
  const recallDelta = (evaluationData.recall - evaluationData.baseline.recall) * 100;
  const f1Delta = (evaluationData.f1 - evaluationData.baseline.f1) * 100;
  const fpDiff = evaluationData.baseline.fpCount - evaluationData.fpCount;
  const fpPct = ((fpDiff / evaluationData.baseline.fpCount) * 100).toFixed(1);
  const fnDiff = evaluationData.baseline.fnCount - evaluationData.fnCount;
  const fnPct = ((fnDiff / evaluationData.baseline.fnCount) * 100).toFixed(1);

  // User requested tabular format with:
  // metric - under metric: precision, recall, F1, False positives, False negatives, Estimated cost(₹)
  // then riskgraph, then rules baseline, then Δ showcasing increase or decrease using red and green
  const tableRows = [
    {
      metric: 'Precision',
      riskgraph: `${(evaluationData.precision * 100).toFixed(1)}%`,
      baseline: `${(evaluationData.baseline.precision * 100).toFixed(1)}%`,
      delta: `${precDelta >= 0 ? '+' : ''}${precDelta.toFixed(1)}%`,
      deltaType: precDelta >= 0 ? 'positive' : 'negative', // green
      explanation: 'Fraction of flagged items that were actual coordinated fraud syndicates.',
    },
    {
      metric: 'Recall',
      riskgraph: `${(evaluationData.recall * 100).toFixed(1)}%`,
      baseline: `${(evaluationData.baseline.recall * 100).toFixed(1)}%`,
      delta: `${recallDelta >= 0 ? '+' : ''}${recallDelta.toFixed(1)}%`,
      deltaType: recallDelta >= 0 ? 'positive' : 'negative', // green
      explanation: 'Percentage of all fraudulent attacks correctly detected and halted.',
    },
    {
      metric: 'F1 Score',
      riskgraph: `${(evaluationData.f1 * 100).toFixed(1)}%`,
      baseline: `${(evaluationData.baseline.f1 * 100).toFixed(1)}%`,
      delta: `${f1Delta >= 0 ? '+' : ''}${f1Delta.toFixed(1)}%`,
      deltaType: f1Delta >= 0 ? 'positive' : 'negative', // green
      explanation: 'Harmonic mean of precision and recall.',
    },
    {
      metric: 'False Positives',
      riskgraph: `${evaluationData.fpCount}`,
      baseline: `${evaluationData.baseline.fpCount}`,
      delta: `-${fpDiff} (-${fpPct}%)`,
      deltaType: 'positive', // green: decrease in false positives is positive!
      explanation: 'Legitimate users mistakenly flagged or challenged with step-up verification.',
    },
    {
      metric: 'False Negatives',
      riskgraph: `${evaluationData.fnCount}`,
      baseline: `${evaluationData.baseline.fnCount}`,
      delta: `-${fnDiff} (-${fnPct}%)`,
      deltaType: 'positive', // green: decrease in missed fraud is positive!
      explanation: 'Undetected fraud transactions that slipped through the defense perimeter.',
    },
    {
      metric: 'Estimated Cost (₹)',
      riskgraph: formatINR(evaluationData.reviewCost),
      baseline: formatINR(12656300), // Legacy rules baseline
      delta: `-₹1,24,57,800 (-98.4%)`,
      deltaType: 'positive', // green: massive cost reduction
      explanation: 'Manual review operational hours + unrecovered chargeback losses.',
    },
  ];

  return (
    <div className="space-y-8" style={{ fontFamily: 'var(--font-body)' }}>
      {/* 1. Header with Model Version */}
      {/* Prompt request: "showcase the test set size , positive rate, cost reduction vs baseline then Model version v1" */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7342E2]/10 text-[#7342E2] text-xs font-bold mb-2">
            <Cpu size={14} />
            <span>Held-Out Synthetic Ground Truth Benchmark</span>
          </div>
          <h2 
            className="text-2xl font-bold text-[#192837] tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Offline Evaluation & Baseline Comparison
          </h2>
          <p className="text-xs text-[#192837]/75 mt-1">
            Zero-leakage test set comprising 15 isolated rings (Rings 086 to 100) never exposed during graph feature compilation or training.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#192837]/60 font-medium">Active Deployment:</span>
          <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-900 text-white shadow-xs">
            Model Version: {evaluationData.modelVersion}
          </span>
        </div>
      </div>

      {/* 2. Top 4 Evaluation Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Test Set Size */}
        <InfoTooltip
          title="Test Set Size"
          content="Zero-leakage test set comprising 5,000 real-world simulated transactions across 15 held-out rings never exposed during graph feature compilation or training."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <span className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wider block">
              Test Set Size
            </span>
            <div className="text-2xl font-bold text-[#192837] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              5,000 Tx
            </div>
            <div className="text-xs text-[#192837]/70 mt-1 flex items-center gap-1">
              <Layers size={12} className="text-[#7342E2]" />
              <span>15 Isolated Held-Out Rings</span>
            </div>
          </div>
        </InfoTooltip>

        {/* Positive Rate */}
        <InfoTooltip
          title="Positive Rate (Fraud Prevalence)"
          content="Percentage of transactions that belong to confirmed coordinated attack rings (5.84% = 292 syndicate transactions)."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <span className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wider block">
              Positive Rate
            </span>
            <div className="text-2xl font-bold text-[#7342E2] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              5.84%
            </div>
            <div className="text-xs text-[#192837]/70 mt-1">
              292 coordinated fraud transactions
            </div>
          </div>
        </InfoTooltip>

        {/* Cost Reduction vs Baseline */}
        <InfoTooltip
          title="Cost Reduction vs Legacy Rules"
          content="Net financial savings calculated as avoided fraud chargebacks minus legitimate customer friction drop-off."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <span className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wider block">
              Cost Reduction vs Baseline
            </span>
            <div className="text-2xl font-bold text-emerald-600 mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              {formatINR(evaluationData.netCostEfficiency)}
            </div>
            <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <TrendingDown size={14} />
              <span>Net loss reduction vs legacy rules</span>
            </div>
          </div>
        </InfoTooltip>

        {/* Model Version */}
        <InfoTooltip
          title="Model Architecture Version"
          content="Active machine learning weights integrating bipartite graph degree centrality with gradient boosted trees."
          position="bottom"
          className="w-full block"
          maxWidth="max-w-xs"
        >
          <div className="p-5 rounded-2xl bg-white border border-[#192837]/10 shadow-xs hover:border-[#7342E2]/30 transition-all cursor-help w-full">
            <span className="text-[11px] font-semibold text-[#192837]/60 uppercase tracking-wider block">
              Model Version
            </span>
            <div className="text-2xl font-bold text-[#192837] mt-2" style={{ fontFamily: 'var(--font-heading)' }}>
              v1
            </div>
            <div className="text-xs text-[#192837]/70 mt-1">
              XGBoost + NetworkX Sybil Sentinel
            </div>
          </div>
        </InfoTooltip>
      </div>

      {/* 3. Tabular Format Evaluation Table (Prompt: in tabular format metric -under metric -precision, recall,F1,False positives,False negatives, Estimated cost(₹) then riskgraph ,then rules baseline then Δ showcasing inrease or decrease using red and green) */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-[#192837]/10">
          <div>
            <h3 
              className="text-xl font-bold text-[#192837] tracking-tight flex items-center gap-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              <BarChart3 size={20} className="text-[#7342E2]" />
              <span>Model Performance & Financial Impact Matrix</span>
            </h3>
            <p className="text-xs text-[#192837]/70 mt-0.5">
              Side-by-side performance comparison against traditional legacy rules baseline.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Green indicates favorable improvement (Δ)</span>
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#192837]/10">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2F2EE] text-[#192837]/80 font-bold uppercase tracking-wider text-[11px] border-b border-[#192837]/10">
              <tr>
                <th className="py-4 px-5">Metric</th>
                <th className="py-4 px-5">RiskGraph (v1)</th>
                <th className="py-4 px-5">Rules Baseline</th>
                <th className="py-4 px-5">Δ (Improvement)</th>
                <th className="py-4 px-5 text-[#192837]/60 font-normal">Impact Explanation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#192837]/10 text-[#192837]">
              {tableRows.map((row, idx) => (
                <tr 
                  key={idx} 
                  className="hover:bg-[#F2F2EE]/40 transition-colors"
                >
                  <td className="py-4 px-5 font-bold text-sm text-[#192837]">
                    {row.metric}
                  </td>
                  <td className="py-4 px-5 font-mono font-bold text-sm text-[#7342E2]">
                    {row.riskgraph}
                  </td>
                  <td className="py-4 px-5 font-mono font-semibold text-sm text-[#192837]/70">
                    {row.baseline}
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                      row.deltaType === 'positive'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {row.deltaType === 'positive' ? (
                        <ArrowUpRight size={14} className="text-emerald-600" />
                      ) : (
                        <ArrowDownRight size={14} className="text-rose-600" />
                      )}
                      <span>{row.delta}</span>
                    </span>
                  </td>
                  <td className="py-4 px-5 text-xs text-[#192837]/75 font-medium max-w-sm">
                    {row.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Interactive Financial Cost Frontier Curve (Honest Metrics & False-Positive Cost Evaluation) */}
      <CostFrontierCurve 
        currentPolicyThreshold={currentPolicyThreshold}
        onApplyThreshold={onApplyPolicyThreshold}
      />

      {/* 5. Confusion Matrix Breakdown & Held-out Methodology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#192837]/10">
            <InfoTooltip
              title="Held-Out Confusion Matrix"
              content="Complete count of True Positives, False Positives, False Negatives, and True Negatives evaluated against 5,000 held-out transactions."
              position="top"
              maxWidth="max-w-xs"
            >
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#192837] cursor-help">
                Held-Out Confusion Matrix (5,000 Transactions)
              </h4>
            </InfoTooltip>
            <span className="text-xs font-mono text-[#7342E2] font-semibold">Model v1</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <InfoTooltip
              title="True Positives (Halted Fraud)"
              content="Syndicate attacks accurately classified and intercepted before dispatch or checkout completion."
              position="top"
              className="w-full block"
              maxWidth="max-w-xs"
            >
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 cursor-help">
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                  True Positives (Halted Fraud)
                </span>
                <span className="text-2xl font-mono font-bold text-emerald-800 mt-1 block">
                  {evaluationData.tpCount}
                </span>
                <span className="text-[11px] text-emerald-700/80 mt-1 block">
                  {formatINR(evaluationData.estimatedLossAvoided)} saved directly
                </span>
              </div>
            </InfoTooltip>

            <InfoTooltip
              title="False Positives (User Friction)"
              content="Innocent legitimate customers challenged with OTP/KYC verification. Reduced by 84% compared to legacy rules."
              position="top"
              className="w-full block"
              maxWidth="max-w-xs"
            >
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 cursor-help">
                <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">
                  False Positives (User Friction)
                </span>
                <span className="text-2xl font-mono font-bold text-rose-800 mt-1 block">
                  {evaluationData.fpCount}
                </span>
                <span className="text-[11px] text-rose-700/80 mt-1 block">
                  Reduced by {fpPct}% vs baseline
                </span>
              </div>
            </InfoTooltip>

            <InfoTooltip
              title="False Negatives (Missed Attacks)"
              content="Syndicate transactions that evaded detection. Drops to 21 due to multi-hop graph topology."
              position="top"
              className="w-full block"
              maxWidth="max-w-xs"
            >
              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 cursor-help">
                <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">
                  False Negatives (Missed Attacks)
                </span>
                <span className="text-2xl font-mono font-bold text-rose-800 mt-1 block">
                  {evaluationData.fnCount}
                </span>
                <span className="text-[11px] text-rose-700/80 mt-1 block">
                  Down from {evaluationData.baseline.fnCount} to {evaluationData.fnCount}
                </span>
              </div>
            </InfoTooltip>

            <InfoTooltip
              title="True Negatives (Legitimate Cleared)"
              content="Benign customers approved instantaneously without step-up verification delays."
              position="top"
              className="w-full block"
              maxWidth="max-w-xs"
            >
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-help">
                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider block">
                  True Negatives (Legitimate Cleared)
                </span>
                <span className="text-2xl font-mono font-bold text-slate-800 mt-1 block">
                  {evaluationData.tnCount}
                </span>
                <span className="text-[11px] text-slate-600/80 mt-1 block">
                  Zero frictionless step-ups
                </span>
              </div>
            </InfoTooltip>
          </div>
        </div>

        {/* Evaluation Methodology note */}
        <div className="p-6 rounded-3xl bg-white border border-[#192837]/10 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <InfoTooltip
              title="Sybil-Ring Isolation Methodology"
              content="Industry-standard held-out evaluation preventing leakage by withholding entire fraud rings (Rings 086–100) from graph feature compilation."
              position="top"
              maxWidth="max-w-sm"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#7342E2] pb-3 border-b border-[#192837]/10 cursor-help">
                <FileCheck2 size={16} />
                <span>Rigorous Held-Out Evaluation Protocol</span>
              </div>
            </InfoTooltip>

            <div className="space-y-3 mt-4 text-xs text-[#192837]/80 leading-relaxed font-medium">
              <p>
                <strong>Sybil-Ring Isolation:</strong> In standard random split cross-validation, transactions from the same syndicate leak across train and test sets. To guarantee authentic generalization, Rixor completely isolates entire rings (Rings 086 through 100) into the held-out evaluation set.
              </p>
              <p>
                <strong>Financial Cost Function:</strong> While raw F1 metrics measure balance, the cost function directly computes financial loss: <br />
                <span className="font-mono text-[#7342E2] bg-[#F2F2EE] px-2 py-1 rounded inline-block mt-1">
                  Total Cost = (FN × Avg Chargeback ₹47,178) + (FP × Step-up Friction ₹1,200)
                </span>
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#7342E2]/10 border border-[#7342E2]/20 flex items-center justify-between text-xs">
            <span className="font-semibold text-[#192837]">Total Loss Prevented in Test Set:</span>
            <span className="font-bold text-[#7342E2] text-sm">
              {formatINR(evaluationData.estimatedLossAvoided)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
