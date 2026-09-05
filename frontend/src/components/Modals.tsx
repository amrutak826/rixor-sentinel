import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Download, 
  ShieldCheck, 
  Key, 
  Smartphone, 
  Globe, 
  HelpCircle, 
  FileText 
} from 'lucide-react';
import { VaultShieldLogo } from './VaultShieldLogo';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

function BaseModal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#192837]/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg bg-[#F2F2EE] text-[#192837] rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border border-[#192837]/10"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#192837]/10 mb-6">
              <h3 
                className="text-xl font-bold tracking-tight text-[#192837]"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-black/5 transition-colors"
                aria-label="Close dialog"
              >
                <X size={20} color="#192837" />
              </button>
            </div>

            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// 1. Sign In Dialog
export function SignInModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Sign in to VaultShield">
      <div className="space-y-4 text-xs">
        <p className="text-[#192837]/80 text-sm">
          Access your ironclad vault with end-to-end zero-knowledge encryption.
        </p>

        <div className="space-y-3 pt-2">
          <div>
            <label className="block font-medium text-[#192837] mb-1">Email address</label>
            <input
              type="email"
              placeholder="alex@example.com"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#192837]/20 text-[#192837] focus:outline-none focus:ring-2 focus:ring-[#7342E2]"
            />
          </div>

          <div>
            <label className="block font-medium text-[#192837] mb-1">Master Password</label>
            <input
              type="password"
              placeholder="••••••••••••••••"
              className="w-full px-4 py-3 rounded-xl bg-white border border-[#192837]/20 text-[#192837] focus:outline-none focus:ring-2 focus:ring-[#7342E2]"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-full font-semibold text-white bg-[#7342E2] hover:brightness-110 active:scale-98 transition-all cursor-pointer text-sm shadow-md"
          >
            Unlock Vault
          </button>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-full font-medium text-[#192837] bg-white border border-[#192837]/15 hover:bg-[#192837]/5 transition-all text-xs flex items-center justify-center gap-2"
          >
            <Key size={16} />
            <span>Sign in with Biometric Passkey</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

// 2. Plans Dialog
export function PlansModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="VaultShield Plans">
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Free Tier */}
          <div className="p-4 rounded-2xl bg-white border border-[#192837]/15 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7342E2]">Free Starter</span>
              <div className="text-2xl font-bold my-2 text-[#192837]">$0 <span className="text-xs font-normal text-[#192837]/60">/ forever</span></div>
              <ul className="space-y-2 text-[#192837]/80 mt-3">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#7342E2]" /> Unlimited passwords</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#7342E2]" /> Zero-knowledge AES-256</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#7342E2]" /> 1 Device Sync</li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-full font-semibold text-xs bg-[#F2F2EE] text-[#192837] hover:bg-[#192837]/10"
            >
              Current Plan
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-4 rounded-2xl bg-[#7342E2]/10 border-2 border-[#7342E2] flex flex-col justify-between relative">
            <span className="absolute -top-2.5 right-4 bg-[#7342E2] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              POPULAR
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#7342E2]">Sentinel Pro</span>
              <div className="text-2xl font-bold my-2 text-[#192837]">$3 <span className="text-xs font-normal text-[#192837]/60">/ month</span></div>
              <ul className="space-y-2 text-[#192837]/80 mt-3">
                <li className="flex items-center gap-2"><Check size={14} className="text-[#7342E2]" /> All devices synced</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#7342E2]" /> Dark web & breach alerts</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#7342E2]" /> RiskGraph AI abuse shield</li>
                <li className="flex items-center gap-2"><Check size={14} className="text-[#7342E2]" /> Priority 24/7 recovery</li>
              </ul>
            </div>
            <button
              onClick={onClose}
              className="mt-5 w-full py-2.5 rounded-full font-semibold text-xs bg-[#7342E2] text-white hover:brightness-110 shadow-sm"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

// 3. Install Dialog
export function InstallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Download & Install VaultShield">
      <div className="space-y-4 text-xs">
        <p className="text-[#192837]/80 text-sm">
          Seamless autofill across your desktop browser, smartphone, and tablet.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 bg-white rounded-xl border border-[#192837]/15 text-center flex flex-col items-center gap-2">
            <Globe size={24} className="text-[#7342E2]" />
            <span className="font-semibold text-[#192837]">Browser Extension</span>
            <span className="text-[10px] text-[#192837]/60">Chrome, Safari, Firefox</span>
            <button onClick={onClose} className="mt-1 text-[11px] font-bold text-[#7342E2] hover:underline">
              Add to Browser
            </button>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#192837]/15 text-center flex flex-col items-center gap-2">
            <Smartphone size={24} className="text-[#7342E2]" />
            <span className="font-semibold text-[#192837]">Mobile App</span>
            <span className="text-[10px] text-[#192837]/60">iOS & Android</span>
            <button onClick={onClose} className="mt-1 text-[11px] font-bold text-[#7342E2] hover:underline">
              Get App
            </button>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#192837]/15 text-center flex flex-col items-center gap-2">
            <Download size={24} className="text-[#7342E2]" />
            <span className="font-semibold text-[#192837]">Desktop App</span>
            <span className="text-[10px] text-[#192837]/60">macOS, Windows, Linux</span>
            <button onClick={onClose} className="mt-1 text-[11px] font-bold text-[#7342E2] hover:underline">
              Download .dmg/.exe
            </button>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}

// 4. News Dialog
export function NewsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="VaultShield News & Changelog">
      <div className="space-y-3 text-xs">
        <div className="p-3 rounded-xl bg-white border border-[#192837]/15">
          <div className="flex items-center justify-between text-[11px] text-[#7342E2] font-semibold mb-1">
            <span>v4.2 Update • Sept 2026</span>
            <span className="bg-[#7342E2]/10 px-2 py-0.5 rounded-full">New</span>
          </div>
          <h4 className="font-bold text-[#192837] text-sm">RiskGraph Abuse-Ring Sentinel Integration</h4>
          <p className="text-[#192837]/70 mt-1">
            Integrated graph-level syndicate detection powered by Nhost PostgreSQL and Python risk intelligence to block coordinated credential stuffing.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-white border border-[#192837]/15">
          <div className="text-[11px] text-[#192837]/50 font-semibold mb-1">v4.1 Update • August 2026</div>
          <h4 className="font-bold text-[#192837] text-sm">Hardware Passkey Synchronization</h4>
          <p className="text-[#192837]/70 mt-1">
            FIDO2 and WebAuthn hardware token support with cross-platform biometric enclave storage.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}

// 5. Help Dialog
export function HelpModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="VaultShield Support & Knowledge Base">
      <div className="space-y-4 text-xs">
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-white border border-[#192837]/15">
            <h4 className="font-bold text-[#192837]">How does zero-knowledge encryption work?</h4>
            <p className="text-[#192837]/70 mt-1">
              Your master password is never sent to our servers. All vault items are encrypted and decrypted on your local device before transmission.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white border border-[#192837]/15">
            <h4 className="font-bold text-[#192837]">What is the RiskGraph sentinel feature?</h4>
            <p className="text-[#192837]/70 mt-1">
              RiskGraph monitors behavioral entity connections (shared hardware, IP proxies, velocity bursts) to safeguard your account against organized attacks.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-full font-semibold text-white bg-[#7342E2] hover:brightness-110 transition-all text-xs"
        >
          Contact 24/7 Security Team
        </button>
      </div>
    </BaseModal>
  );
}
