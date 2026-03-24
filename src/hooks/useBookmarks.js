import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toRestaurantKey } from './useRatings';

export function useBookmarks(currentUser) {
  const [bookmarks, setBookmarks] = useState(new Set());

  useEffect(() => {
    if (!currentUser) { setBookmarks(new Set()); return; }
    async function fetch() {
      try {
        const snap = await getDoc(doc(db, 'bookmarks', currentUser.uid));
        if (snap.exists()) setBookmarks(new Set(snap.data().saved || []));
      } catch (err) {
        console.error('Failed to fetch bookmarks:', err);
      }
    }
    fetch();
  }, [currentUser]);

  const toggleBookmark = useCallback(async (restaurantName) => {
    if (!currentUser) return;
    const key = toRestaurantKey(restaurantName);
    setBookmarks((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      // Persist optimistically
      setDoc(doc(db, 'bookmarks', currentUser.uid), { saved: [...next] })
        .catch((err) => console.error('Failed to save bookmark:', err));
      return next;
    });
  }, [currentUser]);

  const isBookmarked = useCallback((restaurantName) =>
    bookmarks.has(toRestaurantKey(restaurantName)), [bookmarks]);

  return { bookmarks, toggleBookmark, isBookmarked };
}
