import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/constants';

// Budget line items live in a private subcollection under the wedding. They
// hold vendor names, quotes, deposits, and balances — never mirrored to any
// public projection. The catch-all rule in firestore.rules already scopes this
// to editors (write) / collaborators (read).
const BUDGET_SETTINGS_DOC = 'budget';

// Curated Indian-wedding cost categories. Used to seed the picker and to give
// each line item a sensible default grouping.
export const BUDGET_CATEGORIES = [
  'Venue',
  'Catering',
  'Decor & Flowers',
  'Photography',
  'Videography',
  'Attire & Jewelry',
  'Hair & Makeup',
  'Mehndi Artist',
  'DJ & Entertainment',
  'Priest / Pandit',
  'Invitations',
  'Transportation',
  'Accommodation',
  'Gifts & Favors',
  'Miscellaneous',
];

export const BUDGET_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'booked', label: 'Booked' },
  { value: 'partial', label: 'Partially Paid' },
  { value: 'paid', label: 'Paid in Full' },
];

function budgetItemsRef(weddingId) {
  return collection(db, COLLECTIONS.WEDDINGS, weddingId, COLLECTIONS.BUDGET);
}

function budgetSettingsRef(weddingId) {
  return doc(db, COLLECTIONS.WEDDINGS, weddingId, 'settings', BUDGET_SETTINGS_DOC);
}

// Coerce arbitrary user input into a non-negative finite number.
export function toAmount(value) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.round(n * 100) / 100;
}

function normalizeItem(item, index = 0) {
  const estimated = toAmount(item.estimated);
  const actual = toAmount(item.actual);
  const paid = toAmount(item.paid);
  return {
    category: (item.category || 'Miscellaneous').toString().slice(0, 60),
    name: (item.name || '').toString().slice(0, 120),
    vendor: (item.vendor || '').toString().slice(0, 120),
    estimated,
    actual,
    paid,
    dueDate: (item.dueDate || '').toString().slice(0, 20),
    status: BUDGET_STATUSES.some((s) => s.value === item.status) ? item.status : 'planned',
    notes: (item.notes || '').toString().slice(0, 500),
    order: Number.isFinite(item.order) ? item.order : index,
  };
}

export async function addBudgetItem(weddingId, item) {
  const ref = doc(budgetItemsRef(weddingId));
  await setDoc(ref, {
    ...normalizeItem(item),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBudgetItem(weddingId, itemId, data) {
  const ref = doc(budgetItemsRef(weddingId), itemId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Budget item not found');
  await updateDoc(ref, {
    ...normalizeItem({ ...snap.data(), ...data }),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBudgetItem(weddingId, itemId) {
  await deleteDoc(doc(budgetItemsRef(weddingId), itemId));
}

export function subscribeToBudgetItems(weddingId, callback) {
  return onSnapshot(
    budgetItemsRef(weddingId),
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const cat = (a.category || '').localeCompare(b.category || '');
          if (cat !== 0) return cat;
          return (a.order ?? 0) - (b.order ?? 0);
        });
      callback(list);
    },
    (error) => {
      console.error('[budgetService] subscribeToBudgetItems failed:', error);
      callback([]);
    },
  );
}

export async function saveBudgetTarget(weddingId, target) {
  await setDoc(
    budgetSettingsRef(weddingId),
    { target: toAmount(target), updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export function subscribeToBudgetTarget(weddingId, callback) {
  return onSnapshot(
    budgetSettingsRef(weddingId),
    (snap) => callback(snap.exists() ? toAmount(snap.data().target) : 0),
    () => callback(0),
  );
}

// The effective committed cost for an item: the confirmed/actual quote once we
// have one, otherwise the estimate. Balance is whatever remains after payments.
export function itemCommitted(item) {
  const actual = toAmount(item.actual);
  return actual > 0 ? actual : toAmount(item.estimated);
}

export function itemBalance(item) {
  return Math.max(0, itemCommitted(item) - toAmount(item.paid));
}

/**
 * Roll a list of line items into totals + a per-category breakdown. Pure and
 * synchronous so it's trivially unit-testable and cheap to recompute.
 */
export function computeBudgetSummary(items = [], target = 0) {
  const summary = {
    totalEstimated: 0,
    totalActual: 0,
    totalCommitted: 0,
    totalPaid: 0,
    totalBalance: 0,
    itemCount: items.length,
    overBudgetCount: 0,
    target: toAmount(target),
    byCategory: {},
  };

  for (const item of items) {
    const estimated = toAmount(item.estimated);
    const actual = toAmount(item.actual);
    const committed = itemCommitted(item);
    const paid = toAmount(item.paid);
    const balance = itemBalance(item);

    summary.totalEstimated += estimated;
    summary.totalActual += actual;
    summary.totalCommitted += committed;
    summary.totalPaid += paid;
    summary.totalBalance += balance;
    if (actual > 0 && estimated > 0 && actual > estimated) summary.overBudgetCount += 1;

    const cat = item.category || 'Miscellaneous';
    if (!summary.byCategory[cat]) {
      summary.byCategory[cat] = { category: cat, estimated: 0, actual: 0, committed: 0, paid: 0, balance: 0, count: 0 };
    }
    const bucket = summary.byCategory[cat];
    bucket.estimated += estimated;
    bucket.actual += actual;
    bucket.committed += committed;
    bucket.paid += paid;
    bucket.balance += balance;
    bucket.count += 1;
  }

  summary.categories = Object.values(summary.byCategory).sort((a, b) => b.committed - a.committed);
  summary.remainingVsTarget = summary.target > 0 ? summary.target - summary.totalCommitted : null;
  return summary;
}

export function formatCurrency(value, currency = 'USD') {
  const amount = toAmount(value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString()}`;
  }
}
