import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Network, 
  ShieldAlert, 
  ArrowRightCircle, 
  Menu,
  Radio,
  FolderLock,
  BarChart3,
  Sliders,
  ShieldCheck,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { RixorLogo } from './VaultShieldLogo';
import { MobileMenuSheet } from './MobileMenuSheet';
import { FirebaseAuthBar } from './FirebaseAuthBar';
import { InfoTooltip } from './InfoTooltip';
import { User } from 'firebase/auth';
import { AppPage } from './SentinelConsole';

interface HeroSectionProps {
  onNavigatePage: (page: AppPage) => void;
  currentUser?: User | null;
  isAuthLoading?: boolean;
}

const NAV_PAGES: { id: AppPage; label: string; tooltip: string }[] = [
  { 
    id: 'overview', 
    label: 'Overview',
    tooltip: 'A live command screen streaming every payment in real time, with instant flashing alerts the moment a coordinated fraud gang attack is spotted.'
  },
  { 
    id: 'ring-explorer', 
    label: 'Ring Explorer',
    tooltip: 'An interactive visual chart where you can see all the nodes (accounts, computers, credit cards, Wi-Fi networks) and physically see how the criminal gang is linked together behind the scenes.'
  },
  { 
    id: 'cases', 
    label: 'Cases',
    tooltip: 'A clean dashboard where your security team can press "Auto-Block Ring" to freeze all the gang\'s accounts at once. It even has a button that generates an official police report ready to submit to India\'s 1930 Cyber Crime Portal and the banks.'
  },
  { 
    id: 'evaluation', 
    label: 'Evaluation',
    tooltip: 'A rigorous scientific benchmark testing 5,000 transactions on 15 unseen rings, featuring an interactive Financial Cost Frontier to mathematically minimize chargebacks and user friction.'
  },
  { 
    id: 'policy', 
    label: 'Policy',
    tooltip: 'Customizable threshold controls allowing you to set automated block and step-up limits, plus regulatory protection against RBI sub-₹50,000 KYC structuring and virtual card recycling.'
  },
  { 
    id: 'docs', 
    label: 'Docs & FAQ',
    tooltip: 'Complete project walkthrough, How-to guides, API integration examples, troubleshooting playbooks, and system FAQs.'
  },
];

const MODULE_BOXES = [
  {
    id: 'overview' as const,
    title: 'Overview',
    subtitle: 'Live Control Room',
    badge: 'Live Telemetry',
    icon: Radio,
    color: 'text-rose-600',
    borderColor: 'border-rose-200/80 hover:border-rose-400',
    description: 'A live command screen streaming every payment in real time, with instant flashing alerts the moment a coordinated fraud gang attack is spotted.',
  },
  {
    id: 'ring-explorer' as const,
    title: 'Ring Explorer',
    subtitle: 'Spiderweb Map',
    badge: 'Graph Topology',
    icon: Network,
    color: 'text-[#7342E2]',
    borderColor: 'border-[#7342E2]/20 hover:border-[#7342E2]',
    description: 'An interactive visual chart where you can see all the nodes (accounts, computers, credit cards, Wi-Fi networks) and physically see how the criminal gang is linked together behind the scenes.',
  },
  {
    id: 'cases' as const,
    title: 'Cases',
    subtitle: 'Triage & 1930 Dossier',
    badge: 'Dispute Defense',
    icon: FolderLock,
    color: 'text-amber-600',
    borderColor: 'border-amber-200/80 hover:border-amber-400',
    description: 'A clean dashboard where your security team can press "Auto-Block Ring" to freeze all the gang\'s accounts at once. It even has a button that generates an official police report ready to submit to India\'s 1930 Cyber Crime Portal and the banks.',
  },
  {
    id: 'evaluation' as const,
    title: 'Evaluation',
    subtitle: 'Honest Cost Curve',
    badge: 'Held-Out Test Set',
    icon: BarChart3,
    color: 'text-indigo-600',
    borderColor: 'border-indigo-200/80 hover:border-indigo-400',
    description: 'A rigorous scientific benchmark testing 5,000 transactions on 15 unseen rings, featuring an interactive Financial Cost Frontier to mathematically minimize chargebacks and user friction.',
  },
  {
    id: 'policy' as const,
    title: 'Policy',
    subtitle: 'Merchant Rules',
    badge: 'Automated Limits',
    icon: Sliders,
    color: 'text-emerald-600',
    borderColor: 'border-emerald-200/80 hover:border-emerald-400',
    description: 'Customizable threshold controls allowing you to set automated block and step-up limits, plus regulatory protection against RBI sub-₹50,000 KYC structuring and virtual card recycling.',
  },
  {
    id: 'docs' as const,
    title: 'Documentation',
    subtitle: 'Walkthrough & FAQ',
    badge: 'Full Manual',
    icon: BookOpen,
    color: 'text-cyan-700',
    borderColor: 'border-cyan-200/80 hover:border-cyan-400',
    description: 'Comprehensive walkthrough of the 4-tier engine, step-by-step How-to guides, API code snippets, production troubleshooting, and FAQs.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function HeroSection({ onNavigatePage, currentUser, isAuthLoading }: HeroSectionProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [heroNotification, setHeroNotification] = useState<string | null>(null);

  const handleNotification = (msg: string) => {
    setHeroNotification(msg);
    setTimeout(() => setHeroNotification(null), 3500);
  };

  return (
    <div
      id="rixor-hero-container"
      className="relative w-full min-h-screen overflow-y-auto flex flex-col justify-between"
      style={{
        fontFamily: 'var(--font-body)',
        color: 'var(--color-text, #192837)',
      }}
    >
      {/* Fullscreen Background Video covering entire viewport */}
      <video
        id="hero-background-video"
        className="fixed inset-0 w-full h-full object-cover pointer-events-none"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* Subtle overlay for consistent legibility */}
      <div 
        className="fixed inset-0 pointer-events-none bg-gradient-to-b from-black/[0.04] via-transparent to-black/[0.08]" 
        aria-hidden="true" 
      />

      {/* Navbar: max-width 1280px, centered, z-10, px-5 sm:px-8 py-4 sm:py-5, flex items-center justify-between */}
      <header
        id="rixor-navbar"
        className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between"
      >
        {/* Left: Logo */}
        <div 
          id="navbar-brand"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <RixorLogo className="w-8 h-8 transition-transform group-hover:scale-105" />
          <span
            className="font-bold text-2xl tracking-tight text-[#192837]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Rixor
          </span>
        </div>

        {/* Center: Desktop only links with rich hover tooltips */}
        <nav
          id="navbar-desktop-links"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#192837]"
        >
          {NAV_PAGES.map((page) => (
            <InfoTooltip
              key={page.id}
              title={page.label}
              content={page.tooltip}
              position="bottom"
              maxWidth="max-w-xs"
            >
              <button
                id={`nav-link-${page.id}`}
                onClick={() => onNavigatePage(page.id)}
                className="relative transition-opacity hover:opacity-70 focus:outline-none cursor-pointer py-1"
              >
                {page.label}
                {page.id === 'ring-explorer' && (
                  <span className="ml-1.5 inline-block text-[10px] leading-tight font-semibold bg-[#7342E2] text-white px-1.5 py-0.5 rounded-full">
                    Graph
                  </span>
                )}
              </button>
            </InfoTooltip>
          ))}
        </nav>

        {/* Right: Firebase Auth Bar */}
        <div id="navbar-desktop-actions" className="hidden md:flex items-center gap-3">
          <FirebaseAuthBar 
            currentUser={currentUser || null} 
            isLoading={isAuthLoading} 
            onNotification={handleNotification} 
          />
        </div>

        {/* Mobile Hamburger Button */}
        <div className="md:hidden flex items-center">
          <button
            id="navbar-mobile-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
            className="p-2 rounded-lg text-[#192837] hover:bg-black/5 transition-colors cursor-pointer"
          >
            <Menu size={26} color="#192837" />
          </button>
        </div>
      </header>

      {/* Hero Content: adjusted spacing based on user preference */}
      <main
        id="hero-main-content"
        className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8"
        style={{
          paddingTop: 'clamp(48px, 5.5vw, 76px)',
          paddingBottom: 'clamp(28px, 4vw, 48px)',
        }}
      >
        <div id="hero-content-block" className="max-w-[580px]">
          <motion.h1
            id="hero-heading"
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 'clamp(1.75rem, 5vw, 3.2rem)',
              lineHeight: 1.06,
              letterSpacing: '-0.015em',
              color: 'var(--color-text, #192837)',
              marginBottom: '14px',
            }}
            className="font-bold tracking-tight"
          >
            <span 
              className="inline-flex items-center align-middle relative mr-1.5 sm:mr-2"
              style={{ top: '-2px' }}
            >
              <Zap size={26} color="#192837" className="inline-block shrink-0" />
            </span>
            Trace the connections.{' '}
            <span 
              className="inline-flex items-center align-middle relative mx-1.5 sm:mx-2"
              style={{ top: '-2px' }}
            >
              <Network size={26} color="#7342E2" className="inline-block shrink-0" />
            </span>
            Expose the risk{' '}
            <span 
              className="inline-flex items-center align-middle relative ml-1 sm:ml-2"
              style={{ top: '-2px' }}
            >
              <ShieldAlert size={26} color="#192837" className="inline-block shrink-0" />
            </span>
          </motion.h1>

          <motion.p
            id="hero-subtext"
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'clamp(0.95rem, 2.5vw, 1.12rem)',
              lineHeight: 1.6,
              opacity: 0.88,
              maxWidth: '560px',
              color: 'var(--color-text, #192837)',
            }}
            className="mb-5 font-normal"
          >
            AI-powered graph intelligence for detecting coordinated financial fraud, turning hidden transaction relationships into actionable risk intelligence.
          </motion.p>

          <motion.div
            id="hero-cta-wrapper"
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
          >
            <motion.button
              id="hero-cta-button"
              onClick={() => onNavigatePage('overview')}
              whileHover={{ scale: 1.04, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.2 }}
              style={{
                backgroundColor: 'var(--color-accent, #7342E2)',
                color: '#FFFFFF',
                borderRadius: '50px',
                padding: '16px 28px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                boxShadow: '0 4px 24px rgba(115, 66, 226, 0.28)',
                minWidth: '220px',
              }}
              className="inline-flex items-center justify-between gap-8 cursor-pointer border-none select-none group"
            >
              <span>Launch Sentinel Console</span>
              <ArrowRightCircle 
                size={22} 
                className="text-white shrink-0 transition-transform group-hover:translate-x-1" 
              />
            </motion.button>
          </motion.div>
        </div>
      </main>

      {/* Module Architecture Showcase: 3 boxes per row, pushed 3 inches (~288px) down */}
      <section 
        id="hero-scrollable-showcase"
        className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8 pb-16"
        style={{
          marginTop: 'clamp(240px, 22vw, 288px)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7342E2]/10 text-[#7342E2] text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck size={14} />
              <span>Core Defense Architecture & Platform Modules</span>
            </div>
            <h2 
              className="text-xl sm:text-2xl font-bold text-[#192837] tracking-tight"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Explore the Core Modules of Rixor Sentinel
            </h2>
            <p className="text-xs sm:text-sm text-[#192837]/75 mt-1 max-w-2xl">
              From real-time payment ingestion to force-directed graph resolution, police dossiers, and full operational documentation. Click any module to launch directly into it.
            </p>
          </div>
          <span className="text-xs font-mono text-[#192837]/50 self-start sm:self-end">
            Click to Inspect →
          </span>
        </div>

        {/* 3 Boxes in a Row Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULE_BOXES.map((mod) => {
            const Icon = mod.icon;
            return (
              <div
                key={mod.id}
                onClick={() => onNavigatePage(mod.id)}
                className={`group relative p-5 rounded-3xl bg-white/90 hover:bg-white backdrop-blur-md border ${mod.borderColor} shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-2xl bg-[#F2F2EE] ${mod.color} group-hover:scale-110 transition-transform`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#F2F2EE] text-[#192837]/70 font-mono">
                      {mod.badge}
                    </span>
                  </div>

                  <h3 
                    className="text-base font-bold text-[#192837] group-hover:text-[#7342E2] transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {mod.title}
                  </h3>
                  <div className="text-[11px] font-semibold text-[#192837]/50 mb-2">
                    {mod.subtitle}
                  </div>

                  <p className="text-xs text-[#192837]/80 leading-relaxed font-normal">
                    {mod.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#192837]/10 flex items-center justify-between text-xs font-bold text-[#7342E2] group-hover:translate-x-0.5 transition-transform">
                  <span>Open {mod.title}</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Prominent Underline Statement Banner */}
        <div className="mt-8 p-6 sm:p-7 rounded-3xl bg-[#192837] text-white shadow-xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7342E2]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="p-3 rounded-2xl bg-white/10 text-emerald-400 border border-white/10 shrink-0">
              <ShieldCheck size={28} />
            </div>
            <div className="flex-1">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#7342E2] font-bold mb-1">
                The Rixor Defense Mission
              </div>
              <p 
                className="text-base sm:text-lg font-bold text-white leading-snug tracking-tight"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                Rixor is an AI security guard that connects the hidden dots between fake accounts, stopping organized gangs from stealing money from Indian businesses before the orders are shipped.
              </p>
            </div>
            <button
              onClick={() => onNavigatePage('overview')}
              className="mt-2 sm:mt-0 px-5 py-2.5 rounded-2xl bg-[#7342E2] hover:bg-[#5f33be] text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
            >
              Launch Live Console
            </button>
          </div>
        </div>
      </section>

      {/* Footer spacer */}
      <footer className="relative z-10 w-full max-w-[1280px] mx-auto px-5 sm:px-8 py-4 text-xs text-[#192837]/60 flex items-center justify-between border-t border-[#192837]/10">
        <span>© 2026 Rixor Graph Intelligence Inc.</span>
        <button 
          onClick={() => onNavigatePage('ring-explorer')}
          className="hover:underline hover:text-[#7342E2] transition-colors cursor-pointer"
        >
          Explore Live RING-017 Entity Graph →
        </button>
      </footer>

      {/* Floating Notification Toast */}
      {heroNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#192837] text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs border border-white/10 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{heroNotification}</span>
        </div>
      )}

      {/* Mobile Menu Sheet */}
      <MobileMenuSheet
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={['Overview', 'Ring Explorer', 'Cases', 'Evaluation', 'Policy', 'Docs & FAQ']}
        onNavigate={(link) => {
          const mapping: Record<string, AppPage> = {
            'Overview': 'overview',
            'Ring Explorer': 'ring-explorer',
            'Cases': 'cases',
            'Evaluation': 'evaluation',
            'Policy': 'policy',
            'Docs & FAQ': 'docs',
            'Docs': 'docs'
          };
          onNavigatePage(mapping[link] || 'overview');
        }}
        onOpenRiskGraph={() => onNavigatePage('overview')}
      />
    </div>
  );
}
