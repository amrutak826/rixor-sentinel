import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightCircle } from 'lucide-react';
import { RixorLogo } from './VaultShieldLogo';

interface MobileMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: string[];
  onNavigate: (link: string) => void;
  onOpenRiskGraph: () => void;
}

export function MobileMenuSheet({
  isOpen,
  onClose,
  navLinks,
  onNavigate,
  onOpenRiskGraph,
}: MobileMenuSheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id="mobile-menu-container" className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop: rgba(25,40,55,0.35) with blur(4px) */}
          <motion.div
            id="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 cursor-pointer"
            style={{
              backgroundColor: 'rgba(25, 40, 55, 0.35)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Slide-in sheet: fixed right-0 top-0, min(88vw, 360px), 100dvh, #CFC8C5, box-shadow -12px 0 48px rgba(25,40,55,0.18) */}
          <motion.div
            id="mobile-menu-sheet"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="fixed right-0 top-0 flex flex-col justify-between p-6 z-50 text-[#192837]"
            style={{
              width: 'min(88vw, 360px)',
              height: '100dvh',
              backgroundColor: '#CFC8C5',
              boxShadow: '-12px 0 48px rgba(25, 40, 55, 0.18)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <div>
              {/* Header: Logo + Close Button */}
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <RixorLogo className="w-8 h-8" />
                  <span 
                    className="font-bold text-xl tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    Rixor
                  </span>
                </div>
                <button
                  id="mobile-menu-close-btn"
                  onClick={onClose}
                  aria-label="Close Menu"
                  className="p-2 rounded-full hover:bg-[#192837]/10 transition-colors cursor-pointer"
                >
                  <X size={24} color="#192837" />
                </button>
              </div>

              {/* 1px divider */}
              <div className="h-[1px] w-full bg-[#192837]/15 mb-6" />

              {/* Staggered Nav Links (delay: 0.18 + i * 0.07) */}
              <nav className="flex flex-col gap-2">
                {navLinks.map((link, i) => (
                  <motion.button
                    key={link}
                    id={`mobile-nav-${link.toLowerCase().replace(/\s+/g, '-')}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: 0.18 + i * 0.07,
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    onClick={() => {
                      onNavigate(link);
                      onClose();
                    }}
                    className="text-left py-3 px-4 rounded-xl text-base font-semibold text-[#192837] hover:bg-[#192837]/8 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{link}</span>
                    {link === 'Ring Explorer' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#7342E2] text-white font-semibold">
                        Live Graph
                      </span>
                    )}
                  </motion.button>
                ))}
              </nav>
            </div>

            {/* Bottom CTA Button: RiskGraph */}
            <div className="flex flex-col gap-3 pt-6 border-t border-[#192837]/15">
              <button
                id="mobile-riskgraph-btn"
                onClick={() => {
                  onOpenRiskGraph();
                  onClose();
                }}
                className="w-full flex items-center justify-between py-3.5 px-6 rounded-full font-semibold text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                style={{
                  backgroundColor: 'var(--color-accent, #7342E2)',
                  color: '#FFFFFF',
                }}
              >
                <span>Launch RiskGraph</span>
                <ArrowRightCircle size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
