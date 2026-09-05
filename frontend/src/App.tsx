import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, syncUserProfile } from './firebase';
import { HeroSection } from './components/HeroSection';
import { SentinelConsole, AppPage } from './components/SentinelConsole';

export default function App() {
  const [currentView, setCurrentView] = useState<'hero' | 'console'>('hero');
  const [selectedPage, setSelectedPage] = useState<AppPage>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        // Automatically sync user profile to Cloud Firestore
        await syncUserProfile(user);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleNavigatePage = (page: AppPage) => {
    setSelectedPage(page);
    setCurrentView('console');
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#F2F2EE] text-[#192837] selection:bg-[#7342E2] selection:text-white">
      {currentView === 'hero' ? (
        <HeroSection 
          onNavigatePage={handleNavigatePage} 
          currentUser={currentUser}
          isAuthLoading={isAuthLoading}
        />
      ) : (
        <SentinelConsole 
          initialPage={selectedPage} 
          onBackToHero={() => setCurrentView('hero')} 
          currentUser={currentUser}
          isAuthLoading={isAuthLoading}
        />
      )}
    </div>
  );
}
