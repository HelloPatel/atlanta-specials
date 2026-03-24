import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { locationOptions, cuisineOptions, daysOfWeek } from '../common/commonComponents';

const neighborhoods = locationOptions.filter(o => o !== 'All');
const cuisines = cuisineOptions.filter(o => o !== 'All');

export default function SubmitDealModal({ onClose, currentUser, onSignInClick }) {
  const [form, setForm] = useState({
    restaurantName: '',
    website: '',
    location: '',
    cuisine: '',
    day: '',
    deal: '',
  });
  const [honeypot, setHoneypot] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Honeypot — bots fill hidden fields, real users don't
    if (honeypot) { setSubmitted(true); return; }
    if (!form.restaurantName.trim() || !form.day || !form.deal.trim()) {
      setError('Restaurant name, day, and deal description are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'submissions'), {
        restaurantName: form.restaurantName.trim(),
        website: form.website.trim(),
        location: form.location,
        cuisine: form.cuisine,
        day: form.day,
        deal: form.deal.trim(),
        submittedBy: currentUser.uid,
        submittedAt: serverTimestamp(),
        status: 'pending',
      });
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="auth-backdrop" onClick={onClose}>
        <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
          <button className="auth-close" onClick={onClose}>✕</button>
          <h2 className="auth-title">Submit a Deal</h2>
          <p style={{ textAlign: 'center', color: '#555', margin: '16px 0 24px' }}>
            Sign in to submit a restaurant deal.
          </p>
          <button className="auth-submit" onClick={() => { onClose(); onSignInClick(); }}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-backdrop" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}>✕</button>
        <h2 className="auth-title">Submit a Deal</h2>

        {submitted ? (
          <div className="submit-success">
            <svg viewBox="0 0 24 24" fill="none" stroke="#e8534a" strokeWidth="2" width="40" height="40">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>Thanks! We&apos;ll review it shortly.</p>
            <button className="auth-submit" onClick={onClose}>Done</button>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Honeypot — hidden from real users, bots fill it in */}
            <input
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              style={{ position: 'absolute', left: '-9999px', opacity: 0 }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <input
              className="auth-input"
              type="text"
              placeholder="Restaurant name *"
              value={form.restaurantName}
              onChange={set('restaurantName')}
            />
            <input
              className="auth-input"
              type="url"
              placeholder="Website (optional)"
              value={form.website}
              onChange={set('website')}
            />
            <select className="auth-input" value={form.location} onChange={set('location')}>
              <option value="">Neighborhood (optional)</option>
              {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <select className="auth-input" value={form.cuisine} onChange={set('cuisine')}>
              <option value="">Cuisine (optional)</option>
              {cuisines.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="auth-input" value={form.day} onChange={set('day')}>
              <option value="">Day of week *</option>
              {daysOfWeek.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <textarea
              className="auth-input submit-textarea"
              placeholder="Describe the deal *"
              rows={3}
              value={form.deal}
              onChange={set('deal')}
            />
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Deal'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
