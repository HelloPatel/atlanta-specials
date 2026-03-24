import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const MAX_AGE_MS = 45 * 24 * 60 * 60 * 1000; // 45 days

/**
 * Fetches auto-detected deals from Firestore `auto_deals` collection.
 * Returns a Map<restaurantKey, specials> for active, high/medium-confidence entries.
 */
export function useAutoDeals() {
  const [autoDeals, setAutoDeals] = useState(new Map());

  useEffect(() => {
    async function fetch() {
      try {
        const snapshot = await getDocs(collection(db, 'auto_deals'));
        const map = new Map();
        const now = Date.now();

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();

          if (data.status !== 'active') return;
          if (!['high', 'medium'].includes(data.confidence)) return;

          // Check 45-day TTL on lastUpdated
          const lastUpdated = data.lastUpdated?.toDate?.();
          if (!lastUpdated || now - lastUpdated.getTime() > MAX_AGE_MS) return;

          map.set(docSnap.id, data.specials || {});
        });

        setAutoDeals(map);
      } catch (err) {
        console.error('Failed to fetch auto deals:', err);
      }
    }

    fetch();
  }, []);

  return autoDeals;
}
