import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { signInWithGoogle, signOutUser } from '../firebase';
import { 
  LogIn, 
  LogOut, 
  Database, 
  CheckCircle2, 
  ShieldCheck, 
  User as UserIcon,
  ExternalLink,
  AlertCircle
} from 'lucide-react';

interface FirebaseAuthBarProps {
  currentUser: User | null;
  isLoading?: boolean;
  onNotification: (msg: string) => void;
}

export function FirebaseAuthBar({ 
  currentUser, 
  isLoading = false,
  onNotification 
}: FirebaseAuthBarProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        onNotification(`Authenticated with Google as ${user.displayName || user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Popup blocked by browser. Please allow popups or open in a new tab.');
        onNotification('Google sign-in popup was blocked. Please allow popups.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // user cancelled popup
      } else {
        setErrorMessage(err.message || 'Authentication error');
        onNotification(`Sign-in notice: ${err.message || 'Check connection'}`);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      onNotification('Signed out from Google and Firestore');
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* Cloud Firestore Status Badge */}
      <div 
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white border border-slate-700 shadow-xs"
        title="Google Cloud Firestore database connected"
      >
        <Database size={13} className="text-amber-400" />
        <span className="font-semibold text-[11px] hidden xl:inline">Firestore</span>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      {currentUser ? (
        <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-[#192837]/15 shadow-xs">
          {currentUser.photoURL ? (
            <img 
              src={currentUser.photoURL} 
              alt={currentUser.displayName || 'Analyst'} 
              className="w-5 h-5 rounded-full object-cover ring-1 ring-[#7342E2]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-[#7342E2]/10 text-[#7342E2] flex items-center justify-center font-bold text-[10px]">
              {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'A'}
            </div>
          )}
          <div className="hidden sm:block text-left">
            <span className="font-bold text-[#192837] text-[11px] block leading-tight max-w-[120px] truncate">
              {currentUser.displayName || currentUser.email?.split('@')[0] || 'Analyst'}
            </span>
            <span className="text-[9px] text-[#7342E2] font-semibold block leading-tight">
              Cloud Synced
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1 rounded-lg hover:bg-slate-100 text-[#192837]/60 hover:text-rose-600 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut size={13} />
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-[#192837] font-semibold text-xs border border-[#192837]/15 shadow-xs transition-all cursor-pointer disabled:opacity-50"
          title="Sign in with Google to securely identify and persist investigations to Cloud Firestore"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isSigningIn ? 'Connecting...' : 'Sign in'}</span>
        </button>
      )}
    </div>
  );
}
