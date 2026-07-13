import { createContext, useContext, useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLLECTIONS } from '../config/constants';
import { LEGAL_VERSION } from '../config/constants';

const AuthContext = createContext(null);
const PENDING_LEGAL_CONSENT_KEY = 'phera-pending-legal-consent';
const GOOGLE_REGISTRATION_REQUIRED = 'auth/phera-registration-required';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle redirect result (for browsers/devices where popup was blocked)
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const legalConsent = localStorage.getItem(PENDING_LEGAL_CONSENT_KEY) === 'true';
        localStorage.removeItem(PENDING_LEGAL_CONSENT_KEY);
        await ensureUserProfile(result.user, legalConsent);
      }
    }).catch(async (err) => {
      console.error('Google redirect result error:', err);
      if (err.code === GOOGLE_REGISTRATION_REQUIRED) {
        await signOut(auth);
        window.location.replace('/login?authError=registration-required');
      }
    });

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const profileDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
          setUserProfile(profileDoc.exists() ? profileDoc.data() : null);
        } catch (err) {
          console.error('Failed to load user profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const ensureUserProfile = async (firebaseUser, legalConsent = false) => {
    const profileDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (!profileDoc.exists()) {
      if (!legalConsent) {
        const error = new Error('Complete signup before signing in with Google.');
        error.code = GOOGLE_REGISTRATION_REQUIRED;
        throw error;
      }
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL || null,
        plan: 'free',
        createdAt: serverTimestamp(),
        ...(legalConsent ? {
          legalVersion: LEGAL_VERSION,
          termsAcceptedAt: serverTimestamp(),
          privacyAcknowledgedAt: serverTimestamp(),
        } : {}),
      });
    } else if (legalConsent) {
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        legalVersion: LEGAL_VERSION,
        termsAcceptedAt: serverTimestamp(),
        privacyAcknowledgedAt: serverTimestamp(),
      }, { merge: true });
    }
  };

  const register = async (email, password, displayName) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    await setDoc(doc(db, COLLECTIONS.USERS, cred.user.uid), {
      email,
      displayName,
      plan: 'free',
      createdAt: serverTimestamp(),
      legalVersion: LEGAL_VERSION,
      termsAcceptedAt: serverTimestamp(),
      privacyAcknowledgedAt: serverTimestamp(),
    });
    return cred.user;
  };

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  const loginWithGoogle = async ({ legalConsent = false } = {}) => {
    const provider = new GoogleAuthProvider();
    try {
      const cred = await signInWithPopup(auth, provider);
      try {
        await ensureUserProfile(cred.user, legalConsent);
      } catch (err) {
        await signOut(auth);
        throw err;
      }
      return cred.user;
    } catch (err) {
      // Fall back to redirect for any popup-related failure
      const redirectCodes = [
        'auth/popup-blocked',
        'auth/popup-closed-by-user',
        'auth/operation-not-supported-in-this-environment',
        'auth/web-storage-unsupported',
      ];
      if (redirectCodes.includes(err.code)) {
        if (legalConsent) localStorage.setItem(PENDING_LEGAL_CONSENT_KEY, 'true');
        await signInWithRedirect(auth, provider);
        return null;
      }
      throw err;
    }
  };

  const logout = () => signOut(auth);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email);

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
