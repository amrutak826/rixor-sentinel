import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransactionRecord } from '../types';
import { 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  Clock, 
  TrendingUp, 
  Activity, 
  ExternalLink 
} from 'lucide-react';

export interface HighPriorityToast {
  id: string;
  transaction: TransactionRecord;
  receivedAt: string;
  autoDismissMs?: number;
}

interface ToastNotificationContainerProps {
  toasts: HighPriorityToast[];
  onDismiss: (id: string) => void;
  onInvestigate: (tx: TransactionRecord) => void;
}

const formatINR = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

export function ToastNotificationContainer({
  toasts,
  onDismiss,
  onInvestigate,
}: ToastNotificationContainerProps) {
  return (
    <div 
      aria-live="assertive"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => onDismiss(toast.id)}
            onInvestigate={() => {
              onInvestigate(toast.transaction);
              onDismiss(toast.id);
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItemProps {
  key?: React.Key;
  toast: HighPriorityToast;
  onDismiss: () => void;
  onInvestigate: () => void;
}

function ToastItem({ toast, onDismiss, onInvestigate }: ToastItemProps) {
  const { transaction, autoDismissMs = 8000 } = toast;
  const isCritical = transaction.riskScore >= 0.90 || transaction.status === 'BLOCKED';
  const [isPaused, setIsPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (isPaused) return;

    const intervalMs = 100;
    const timer = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + intervalMs;
        if (next >= autoDismissMs) {
          clearInterval(timer);
          // Safely trigger dismissal outside of the state reduction phase
          setTimeout(() => {
            onDismissRef.current?.();
          }, 0);
          return autoDismissMs;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPaused, autoDismissMs]);

  const progress = Math.max(0, 100 - (elapsed / autoDismissMs) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      layout
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`pointer-events-auto relative overflow-hidden rounded-2xl shadow-2xl border backdrop-blur-md transition-all ${
        isCritical
          ? 'bg-slate-950 text-white border-rose-500/50 ring-2 ring-rose-500/30'
          : 'bg-slate-950 text-white border-amber-500/50 ring-2 ring-amber-500/30'
      }`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Top Banner Accent Indicator */}
      <div className={`h-1.5 w-full ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`} />

      {/* Main Toast Content Body */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${
              isCritical ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {isCritical ? <ShieldAlert size={20} className="animate-pulse" /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  {isCritical ? 'Critical Risk Intercepted' : 'High Priority Risk Alert'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/80">
                  <Activity size={10} className="text-emerald-400" />
                  LIVE
                </span>
              </div>
              <h4 
                className="text-sm font-bold text-white mt-0.5"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {transaction.id} • {transaction.customerId}
              </h4>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>

        {/* Transaction Metadata Pill Bar */}
        <div className="mt-3 grid grid-cols-2 gap-2 bg-white/5 p-2.5 rounded-xl border border-white/10 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-white/50 block">Amount</span>
            <span className="font-mono font-bold text-white text-sm">
              {formatINR(transaction.amount)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-white/50 block">Risk Score</span>
            <span className={`font-mono font-bold text-sm ${
              isCritical ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {Math.round(transaction.riskScore * 100)}% ({transaction.status})
            </span>
          </div>
        </div>

        {/* Evidence Snippet */}
        <div className="mt-2.5 text-xs text-white/80 line-clamp-2 bg-white/[0.03] p-2 rounded-lg border border-white/5">
          <span className="text-[#7342E2] font-semibold mr-1">Signal:</span>
          {transaction.evidence[0]?.explanation || 'Automated multi-hop Sybil cluster collision'}
        </div>

        {/* Action Button Strip */}
        <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/50 flex items-center gap-1 font-mono">
            <Clock size={11} />
            <span>{toast.receivedAt}</span>
          </span>

          <button
            onClick={onInvestigate}
            className="px-3.5 py-1.5 rounded-xl bg-[#7342E2] hover:brightness-110 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>View in Overview</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Bottom Dismiss Progress Bar */}
      <div className="h-1 w-full bg-white/10">
        <div
          className={`h-full transition-all duration-75 ${
            isCritical ? 'bg-rose-500' : 'bg-amber-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}
