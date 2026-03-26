import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        const q = query(collection(db, 'submissions'), where('status', '==', 'pending'));
        const snap = await getDocs(q);
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        items.sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0));
        setSubmissions(items);
      } catch (err) {
        console.error('Failed to fetch submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  async function updateStatus(id, status) {
    try {
      await updateDoc(doc(db, 'submissions', id), { status });
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to update submission:', err);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <button className="admin-back-btn" onClick={() => { window.location.hash = ''; }}>
          ← Back
        </button>
        <h1 className="admin-title">Submissions</h1>
        {!loading && <span className="admin-count">{submissions.length} pending</span>}
      </div>

      {loading && <p className="admin-empty">Loading…</p>}

      {!loading && submissions.length === 0 && (
        <p className="admin-empty">No pending submissions.</p>
      )}

      {submissions.map((s) => (
        <div key={s.id} className="submission-card">
          <div className="submission-name">{s.restaurantName}</div>
          <div className="submission-deal">
            <strong>{s.day}:</strong> {s.deal}
          </div>
          <div className="submission-meta">
            {s.location && <span>📍 {s.location}</span>}
            {s.cuisine && <span>🍽 {s.cuisine}</span>}
            {s.website && <span>🔗 <a href={s.website} target="_blank" rel="noopener noreferrer">{s.website}</a></span>}
            {s.submittedAt && (
              <span>🕐 {new Date(s.submittedAt.seconds * 1000).toLocaleDateString()}</span>
            )}
          </div>
          <div className="submission-actions">
            <button className="admin-approve-btn" onClick={() => updateStatus(s.id, 'approved')}>
              Approve
            </button>
            <button className="admin-dismiss-btn" onClick={() => updateStatus(s.id, 'rejected')}>
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
