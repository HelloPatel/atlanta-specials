import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { COLLECTIONS } from '../../config/constants';
import { Clock, Check, X, UserPlus, Edit3 } from 'lucide-react';

const ICONS = {
  accepted: { icon: Check, color: 'text-green-600', bg: 'bg-green-50' },
  declined: { icon: X, color: 'text-red-600', bg: 'bg-red-50' },
  added: { icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50' },
  modified: { icon: Edit3, color: 'text-purple-600', bg: 'bg-purple-50' },
};

function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function ActivityFeed({ weddingId }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    if (!weddingId) return;
    const ref = collection(db, COLLECTIONS.WEDDINGS, weddingId, 'activity');
    const q = query(ref, orderBy('timestamp', 'desc'), limit(10));
    return onSnapshot(q, (snap) => {
      setActivities(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {
      // Collection may not exist yet — that's fine
      setActivities([]);
    });
  }, [weddingId]);

  if (activities.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-gray-400">
        <Clock size={20} className="mx-auto mb-2 text-gray-300" />
        Activity will appear here as guests RSVP and changes are made.
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {activities.map((activity) => {
        const config = ICONS[activity.type] || ICONS.modified;
        const Icon = config.icon;
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${config.bg}`}>
              <Icon size={12} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-800 truncate">{activity.message}</p>
              <p className="text-xs text-gray-400">{formatTimeAgo(activity.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
