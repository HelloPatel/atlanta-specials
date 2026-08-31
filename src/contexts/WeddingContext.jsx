import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { COLLECTIONS } from '../config/constants';
import { publishWedding } from '../services/weddingService';

const WeddingContext = createContext(null);

// ─── Role → feature access matrix ───────────────────────────────────────────
// Feature keys map 1:1 to the sidebar routes (dashboard, guests, events,
// seating, rsvp, print, photos, bets, website).
// `null` = full access (owner/editor). Otherwise { view, edit } where 'ALL'
// means every feature, or an array of feature keys.
const ALL_FEATURES = [
  'dashboard', 'guests', 'events', 'seating',
  'rsvp', 'catering', 'budget', 'print', 'photos', 'bets', 'website',
];

const ROLE_ACCESS = {
  owner: null,
  editor: null,
  viewer: { view: 'ALL', edit: [] },
  // Wedding planner: coordinates logistics — edits Photo Groups + Games,
  // reads Events + Seating, and never touches guest personal info.
  planner: { view: ['events', 'seating', 'photos', 'bets'], edit: ['photos', 'bets'] },
  // Dealer: runs the Games (bets) page only.
  dealer: { view: ['bets'], edit: ['bets'] },
};

// Roles that must not see guest personal info (names, contact, dietary, family).
const NO_GUEST_PII_ROLES = ['planner', 'dealer'];

export function WeddingProvider({ children }) {
  const { user, userProfile } = useAuth();
  const [ownedWeddings, setOwnedWeddings] = useState([]);
  const [collabWeddings, setCollabWeddings] = useState([]);
  const [activeWedding, setActiveWedding] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to weddings owned by the user
  useEffect(() => {
    if (!user) {
      setOwnedWeddings([]);
      setCollabWeddings([]);
      setActiveWedding(null);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.WEDDINGS),
      where('ownerId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data(), _role: 'owner' }));
      setOwnedWeddings(list);
      setLoading(false);
    }, (error) => {
      console.error('Wedding subscription error:', error);
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // Listen to weddings where user is a collaborator
  useEffect(() => {
    if (!user) return;

    const email = user.email?.toLowerCase();
    if (!email) return;

    const q = query(
      collection(db, COLLECTIONS.WEDDINGS),
      where('collaboratorEmails', 'array-contains', email)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const list = [];
      for (const d of snap.docs) {
        const data = d.data();
        // Determine role from collaborators subcollection
        let role = 'viewer';
        try {
          const collabQ = query(
            collection(db, COLLECTIONS.WEDDINGS, d.id, 'collaborators'),
            where('email', '==', email)
          );
          const collabSnap = await import('firebase/firestore').then(({ getDocs }) => getDocs(collabQ));
          if (!collabSnap.empty) {
            role = collabSnap.docs[0].data().role || 'viewer';
          }
        } catch {
          // fallback to viewer
        }
        list.push({ id: d.id, ...data, _role: role });
      }
      setCollabWeddings(list);
    }, (error) => {
      console.error('Collab wedding subscription error:', error);
    });

    return unsub;
  }, [user]);

  // Merge owned + collab weddings
  const weddings = useMemo(() => {
    const all = [...ownedWeddings, ...collabWeddings];
    // Deduplicate by id (owner takes precedence)
    const seen = new Set();
    return all.filter((w) => {
      if (seen.has(w.id)) return false;
      seen.add(w.id);
      return true;
    });
  }, [ownedWeddings, collabWeddings]);

  // Auto-select first wedding
  useEffect(() => {
    setActiveWedding((current) => {
      if (!current && weddings.length > 0) return weddings[0];
      // Update active wedding data if it changed
      if (current) {
        const updated = weddings.find((w) => w.id === current.id);
        if (updated) return updated;
      }
      return current;
    });
  }, [weddings]);

  // Current user's role for the active wedding
  const userRole = useMemo(() => {
    if (!activeWedding) return null;
    return activeWedding._role || 'owner';
  }, [activeWedding]);

  const isViewer = userRole === 'viewer';
  const canEdit = userRole === 'owner' || userRole === 'editor';

  // Granular per-feature permission helpers (used by planner/dealer roles).
  const canViewFeature = useMemo(() => {
    const access = ROLE_ACCESS[userRole];
    return (feature) => {
      if (access === undefined) return canEdit; // unknown role → fall back to canEdit
      if (access === null) return true;         // owner / editor
      if (access.view === 'ALL') return true;
      return access.view.includes(feature);
    };
  }, [userRole, canEdit]);

  const canEditFeature = useMemo(() => {
    const access = ROLE_ACCESS[userRole];
    return (feature) => {
      if (access === undefined) return canEdit;
      if (access === null) return true;
      if (access.edit === 'ALL') return true;
      return Array.isArray(access.edit) && access.edit.includes(feature);
    };
  }, [userRole, canEdit]);

  // Ordered list of features this role may see (used for nav + default route).
  const allowedFeatures = useMemo(
    () => ALL_FEATURES.filter((f) => canViewFeature(f)),
    [canViewFeature],
  );

  // Whether the current role may see guest personal info anywhere in the app.
  const canViewGuestPII = !NO_GUEST_PII_ROLES.includes(userRole);

  useEffect(() => {
    if (!activeWedding || !canEdit) return;
    publishWedding(activeWedding.id, activeWedding).catch((error) => {
      console.error('Failed to publish minimized wedding data:', error);
    });
  }, [activeWedding, canEdit]);

  const selectWedding = async (weddingId) => {
    const found = weddings.find((w) => w.id === weddingId);
    if (found) {
      setActiveWedding(found);
      return;
    }
    const docSnap = await getDoc(doc(db, COLLECTIONS.WEDDINGS, weddingId));
    if (docSnap.exists()) {
      setActiveWedding({ id: docSnap.id, ...docSnap.data(), _role: 'owner' });
    }
  };

  const value = {
    weddings,
    activeWedding,
    setActiveWedding,
    selectWedding,
    loading,
    userRole,    // 'owner' | 'editor' | 'viewer' | 'planner' | 'dealer'
    isViewer,    // true if read-only
    canEdit,     // true if owner or editor (global edit)
    canViewFeature,   // (feature) => bool — may this role open the page
    canEditFeature,   // (feature) => bool — may this role edit the page
    allowedFeatures,  // ordered feature keys this role can see
    canViewGuestPII,  // false for planner/dealer
  };

  return <WeddingContext.Provider value={value}>{children}</WeddingContext.Provider>;
}

export function useWedding() {
  const ctx = useContext(WeddingContext);
  if (!ctx) throw new Error('useWedding must be used within WeddingProvider');
  return ctx;
}
