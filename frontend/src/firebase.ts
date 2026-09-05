import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  collection, 
  getDocFromServer,
  serverTimestamp 
} from 'firebase/firestore';
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID,
};
import { PolicyConfig, RiskCase, RecommendedAction } from './types';

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Cloud Firestore
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Validate Connection to Firestore as per skill guidelines
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is currently offline. Verifying connection...");
      return false;
    }
    // Permission denied on test/connection is normal and confirms we reached the server
    return true;
  }
}

// Automatically invoke connectivity test
validateFirestoreConnection();

/**
 * Authentication Helpers
 */
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserProfile(result.user);
    }
    return result.user;
  } catch (err: any) {
    console.error('Google Sign-in failed:', err);
    throw err;
  }
}

export async function signOutUser() {
  try {
    await signOut(auth);
  } catch (err: any) {
    console.error('Sign-out failed:', err);
    throw err;
  }
}

export async function syncUserProfile(user: User) {
  try {
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Fraud Analyst',
        photoURL: user.photoURL || '',
        role: 'analyst',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error('Error syncing user profile to Firestore:', err);
  }
}

/**
 * Firestore Data Persistence Helpers
 */
export async function saveUserCaseDecisionToFirestore(
  userId: string,
  caseItem: RiskCase,
  action: RecommendedAction,
  reason: string
) {
  try {
    const caseDocRef = doc(db, 'users', userId, 'cases', caseItem.id);
    await setDoc(caseDocRef, {
      id: caseItem.id,
      ringId: caseItem.ringId,
      title: caseItem.title,
      priority: caseItem.priority,
      status: action === 'BLOCK' ? 'RESOLVED' : 'INVESTIGATING',
      totalVolume: caseItem.totalVolume,
      totalTransactions: caseItem.totalTransactions,
      userId,
      decisionAction: action,
      decisionReason: reason,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error(`Failed to persist case ${caseItem.id} to Firestore:`, err);
    throw err;
  }
}

export async function loadUserCasesFromFirestore(userId: string): Promise<Record<string, { status: string; action: RecommendedAction; reason: string }>> {
  try {
    const casesCollectionRef = collection(db, 'users', userId, 'cases');
    const snapshot = await getDocs(casesCollectionRef);
    const result: Record<string, { status: string; action: RecommendedAction; reason: string }> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      result[docSnap.id] = {
        status: data.status,
        action: data.decisionAction,
        reason: data.decisionReason || '',
      };
    });
    return result;
  } catch (err) {
    console.error('Failed to load user cases from Firestore:', err);
    return {};
  }
}

export async function saveUserPolicyToFirestore(userId: string, policy: PolicyConfig) {
  try {
    const policyDocRef = doc(db, 'users', userId, 'policy', 'active');
    await setDoc(policyDocRef, {
      userId,
      reviewThreshold: policy.reviewThreshold,
      holdThreshold: policy.holdThreshold,
      blockThreshold: policy.blockThreshold,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save policy to Firestore:', err);
    throw err;
  }
}

export async function loadUserPolicyFromFirestore(userId: string): Promise<Partial<PolicyConfig> | null> {
  try {
    const policyDocRef = doc(db, 'users', userId, 'policy', 'active');
    const snap = await getDoc(policyDocRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        reviewThreshold: data.reviewThreshold,
        holdThreshold: data.holdThreshold,
        blockThreshold: data.blockThreshold,
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to load user policy from Firestore:', err);
    return null;
  }
}
