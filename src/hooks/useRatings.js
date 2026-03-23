import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  getDocs,
  doc,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

export function toRestaurantKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function useRatings(currentUser) {
  const [ratings, setRatings] = useState(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRatings() {
      try {
        const snapshot = await getDocs(collection(db, 'ratings'));
        const map = new Map();
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          map.set(docSnap.id, {
            averageRating: data.averageRating || 0,
            totalRatings: data.totalRatings || 0,
            userRating: currentUser ? (data.userRatings?.[currentUser.uid] || 0) : 0,
          });
        });
        setRatings(map);
      } catch (err) {
        console.error('Failed to fetch ratings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRatings();
  }, [currentUser]);

  const submitRating = useCallback(async (restaurantName, stars) => {
    if (!currentUser) return;
    const key = toRestaurantKey(restaurantName);
    const ref = doc(db, 'ratings', key);

    // Optimistic update
    setRatings((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) || { averageRating: 0, totalRatings: 0, userRating: 0 };
      const wasRated = existing.userRating > 0;
      const newTotal = wasRated ? existing.totalRatings : existing.totalRatings + 1;
      const newSum = existing.averageRating * existing.totalRatings - existing.userRating + stars;
      next.set(key, {
        averageRating: newTotal > 0 ? newSum / newTotal : stars,
        totalRatings: newTotal,
        userRating: stars,
      });
      return next;
    });

    // Persist to Firestore
    try {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref);
        if (!snap.exists()) {
          tx.set(ref, {
            averageRating: stars,
            totalRatings: 1,
            userRatings: { [currentUser.uid]: stars },
          });
        } else {
          const data = snap.data();
          const oldRating = data.userRatings?.[currentUser.uid] || 0;
          const wasRated = oldRating > 0;
          const newTotal = wasRated ? data.totalRatings : data.totalRatings + 1;
          const newSum = data.averageRating * data.totalRatings - oldRating + stars;
          tx.update(ref, {
            averageRating: newSum / newTotal,
            totalRatings: newTotal,
            [`userRatings.${currentUser.uid}`]: stars,
          });
        }
      });
    } catch (err) {
      console.error('Failed to submit rating:', err);
      // Re-fetch to restore accurate state on error
      const snapshot = await getDocs(collection(db, 'ratings'));
      const map = new Map();
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        map.set(docSnap.id, {
          averageRating: data.averageRating || 0,
          totalRatings: data.totalRatings || 0,
          userRating: currentUser ? (data.userRatings?.[currentUser.uid] || 0) : 0,
        });
      });
      setRatings(map);
    }
  }, [currentUser]);

  return { ratings, loading, submitRating };
}
