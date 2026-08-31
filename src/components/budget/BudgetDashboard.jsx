import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Wallet, Plus, Pencil, Trash2, Download, Target, TrendingUp, TrendingDown,
  CircleDollarSign, AlertTriangle, Check, Search,
  Paperclip, FileText, Image as ImageIcon, X, Loader2, ExternalLink,
} from 'lucide-react';
import { useWedding } from '../../contexts/WeddingContext';
import { Button, Input, Modal, Badge, useToast } from '../ui';
import {
  BUDGET_CATEGORIES,
  BUDGET_STATUSES,
  addBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  subscribeToBudgetItems,
  subscribeToBudgetTarget,
  saveBudgetTarget,
  computeBudgetSummary,
  itemCommitted,
  itemBalance,
  formatCurrency,
} from '../../services/budgetService';
import {
  uploadBudgetAttachment,
  removeBudgetAttachment,
} from '../../services/budgetAttachmentService';

const STATUS_VARIANT = {
  planned: 'default',
  booked: 'info',
  partial: 'warning',
  paid: 'success',
};

const STATUS_LABEL = Object.fromEntries(BUDGET_STATUSES.map((s) => [s.value, s.label]));

// A soft, repeatable palette so each category bar has its own hue.
const CATEGORY_HUES = [346, 265, 24, 199, 152, 291, 42, 172, 320, 96, 224, 12, 260, 140, 0];
function hueFor(category) {
  let sum = 0;
  for (let i = 0; i < category.length; i += 1) sum += category.charCodeAt(i);
  return CATEGORY_HUES[sum % CATEGORY_HUES.length];
}

const EMPTY_ITEM = {
  category: BUDGET_CATEGORIES[0],
  name: '',
  vendor: '',
  estimated: '',
  actual: '',
  paid: '',
  dueDate: '',
  status: 'planned',
  notes: '',
};

export default function BudgetDashboard() {
  const { activeWedding, canEditFeature } = useWedding();
  const canEdit = canEditFeature('budget');
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [target, setTarget] = useState(0);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);

  const [targetOpen, setTargetOpen] = useState(false);
  const [targetDraft, setTargetDraft] = useState('');

  useEffect(() => {
    if (!activeWedding) return undefined;
    setLoading(true);
    const unsub1 = subscribeToBudgetItems(activeWedding.id, (list) => {
      setItems(list);
      setLoading(false);
    });
    const unsub2 = subscribeToBudgetTarget(activeWedding.id, setTarget);
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  const summary = useMemo(() => computeBudgetSummary(items, target), [items, target]);
  const maxCategory = useMemo(
    () => summary.categories.reduce((m, c) => Math.max(m, c.committed), 0),
    [summary.categories],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      if (categoryFilter !== 'all' && it.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && it.status !== statusFilter) return false;
      if (q && !`${it.name} ${it.vendor} ${it.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, categoryFilter, statusFilter, search]);

  // Group filtered items by category for the table, preserving spend order.
  const grouped = useMemo(() => {
    const byCat = new Map();
    for (const it of filtered) {
      if (!byCat.has(it.category)) byCat.set(it.category, []);
      byCat.get(it.category).push(it);
    }
    return [...byCat.entries()]
      .map(([category, rows]) => ({
        category,
        rows,
        committed: rows.reduce((s, r) => s + itemCommitted(r), 0),
        paid: rows.reduce((s, r) => s + Number(r.paid || 0), 0),
      }))
      .sort((a, b) => b.committed - a.committed);
  }, [filtered]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_ITEM, category: categoryFilter !== 'all' ? categoryFilter : BUDGET_CATEGORIES[0] });
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      category: item.category || BUDGET_CATEGORIES[0],
      name: item.name || '',
      vendor: item.vendor || '',
      estimated: item.estimated ?? '',
      actual: item.actual ?? '',
      paid: item.paid ?? '',
      dueDate: item.dueDate || '',
      status: item.status || 'planned',
      notes: item.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!activeWedding) { toast.error('No active wedding selected.'); return; }
    if (!form.name.trim()) { toast.error('Give this line item a name.'); return; }
    setSaving(true);
    try {
      if (editing) {
        await updateBudgetItem(activeWedding.id, editing.id, form);
        toast.success('Budget item updated');
      } else {
        await addBudgetItem(activeWedding.id, { ...form, order: items.length });
        toast.success('Budget item added');
      }
      setModalOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Could not save budget item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!activeWedding) return;
    if (!window.confirm(`Delete "${item.name || 'this item'}" from the budget?`)) return;
    try {
      await deleteBudgetItem(activeWedding.id, item.id);
      toast.success('Budget item removed');
    } catch (err) {
      toast.error(err?.message || 'Could not delete item.');
    }
  };

  const handleSaveTarget = async (e) => {
    e.preventDefault();
    if (!activeWedding) return;
    try {
      await saveBudgetTarget(activeWedding.id, targetDraft);
      toast.success('Budget target saved');
      setTargetOpen(false);
    } catch (err) {
      toast.error(err?.message || 'Could not save target.');
    }
  };

  const exportCsv = () => {
    const header = ['Category', 'Item', 'Vendor', 'Estimated', 'Actual', 'Paid', 'Balance', 'Due Date', 'Status'];
    const rows = items.map((it) => [
      it.category, it.name, it.vendor,
      it.estimated || 0, it.actual || 0, it.paid || 0, itemBalance(it),
      it.dueDate || '', STATUS_LABEL[it.status] || it.status,
    ]);
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget-${activeWedding?.id || 'wedding'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const targetPct = summary.target > 0 ? Math.min(100, Math.round((summary.totalCommitted / summary.target) * 100)) : 0;
  const overTarget = summary.target > 0 && summary.totalCommitted > summary.target;

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <span className="sr-only">Loading budget</span>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={CircleDollarSign} label="Estimated" value={formatCurrency(summary.totalEstimated)}
          tint="from-slate-50 to-white" iconTint="text-slate-500"
        />
        <StatCard
          icon={TrendingUp} label="Committed" value={formatCurrency(summary.totalCommitted)}
          sub={summary.overBudgetCount > 0 ? `${summary.overBudgetCount} over estimate` : undefined}
          tint="from-wine-50 to-white" iconTint="text-wine-600"
        />
        <StatCard
          icon={Check} label="Paid" value={formatCurrency(summary.totalPaid)}
          sub={summary.totalCommitted > 0 ? `${Math.round((summary.totalPaid / summary.totalCommitted) * 100)}% settled` : undefined}
          tint="from-emerald-50 to-white" iconTint="text-emerald-600"
        />
        <StatCard
          icon={TrendingDown} label="Balance Due" value={formatCurrency(summary.totalBalance)}
          tint="from-amber-50 to-white" iconTint="text-amber-600"
        />
      </div>

      {/* Budget target progress */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-wine-100 text-wine-700">
              <Target size={18} />
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900">Overall Budget Target</p>
              <p className="text-xs text-gray-500">
                {summary.target > 0
                  ? `${formatCurrency(summary.totalCommitted)} committed of ${formatCurrency(summary.target)}`
                  : 'Set a target to track how much of your budget is spoken for.'}
              </p>
            </div>
          </div>
          {canEdit && (
            <Button
              variant="outline" size="sm"
              onClick={() => { setTargetDraft(summary.target ? String(summary.target) : ''); setTargetOpen(true); }}
            >
              {summary.target > 0 ? 'Edit target' : 'Set target'}
            </Button>
          )}
        </div>
        {summary.target > 0 && (
          <div className="mt-4">
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ${overTarget ? 'bg-red-500' : 'bg-gradient-to-r from-wine-500 to-wine-700'}`}
                style={{ width: `${targetPct}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className={overTarget ? 'font-semibold text-red-600' : 'text-gray-500'}>
                {overTarget
                  ? `${formatCurrency(summary.totalCommitted - summary.target)} over budget`
                  : `${formatCurrency(Math.max(0, summary.target - summary.totalCommitted))} left to allocate`}
              </span>
              <span className="font-medium text-gray-600">{targetPct}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Category breakdown chart */}
      {summary.categories.length > 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">Where the money goes</h3>
          <div className="space-y-3">
            {summary.categories.map((c) => {
              const pct = maxCategory > 0 ? Math.round((c.committed / maxCategory) * 100) : 0;
              const paidPct = c.committed > 0 ? Math.round((c.paid / c.committed) * 100) : 0;
              const hue = hueFor(c.category);
              return (
                <div key={c.category}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-700">{c.category}</span>
                    <span className="tabular-nums text-gray-500">
                      {formatCurrency(c.committed)}
                      <span className="ml-1 text-gray-400">· {paidPct}% paid</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${Math.max(4, pct)}%`, backgroundColor: `hsl(${hue} 70% 55%)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[10rem] flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item or vendor…"
            aria-label="Search budget items"
            className="min-h-11 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-600/20"
          />
        </div>
        <select
          value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-600/20"
        >
          <option value="all">All categories</option>
          {summary.categories.map((c) => <option key={c.category} value={c.category}>{c.category}</option>)}
        </select>
        <select
          value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="min-h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-600/20"
        >
          <option value="all">All statuses</option>
          {BUDGET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        {items.length > 0 && (
          <Button variant="outline" size="md" onClick={exportCsv} className="whitespace-nowrap">
            <Download size={16} /> Export
          </Button>
        )}
        {canEdit && (
          <Button variant="primary" size="md" onClick={openAdd} className="whitespace-nowrap">
            <Plus size={16} /> Add item
          </Button>
        )}
      </div>

      {/* Line items */}
      {items.length === 0 ? (
        <EmptyState canEdit={canEdit} onAdd={openAdd} />
      ) : grouped.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
          No items match your filters.
        </p>
      ) : (
        <div className="space-y-5">
          {grouped.map((group) => (
            <div key={group.category} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div
                className="flex items-center justify-between px-4 py-3"
                style={{ background: `linear-gradient(90deg, hsl(${hueFor(group.category)} 70% 96%), #fff)` }}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: `hsl(${hueFor(group.category)} 70% 55%)` }} />
                  <h3 className="text-sm font-semibold text-gray-900">{group.category}</h3>
                  <span className="text-xs text-gray-400">({group.rows.length})</span>
                </div>
                <span className="text-xs font-medium tabular-nums text-gray-600">{formatCurrency(group.committed)}</span>
              </div>

              {/* Desktop table */}
              <table className="hidden w-full text-sm sm:table">
                <thead>
                  <tr className="border-t border-gray-100 text-left text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-4 py-2 font-medium">Item</th>
                    <th className="px-4 py-2 font-medium">Vendor</th>
                    <th className="px-4 py-2 text-right font-medium">Estimated</th>
                    <th className="px-4 py-2 text-right font-medium">Actual</th>
                    <th className="px-4 py-2 text-right font-medium">Paid</th>
                    <th className="px-4 py-2 text-right font-medium">Balance</th>
                    <th className="px-4 py-2 font-medium">Due</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    {canEdit && <th className="px-4 py-2" />}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((it) => {
                    const over = it.actual > 0 && it.estimated > 0 && it.actual > it.estimated;
                    return (
                      <tr key={it.id} className="border-t border-gray-100 hover:bg-gray-50/60">
                        <td className="px-4 py-2.5 font-medium text-gray-900">{it.name || '—'}</td>
                        <td className="px-4 py-2.5 text-gray-500">{it.vendor || '—'}</td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-gray-600">{it.estimated ? formatCurrency(it.estimated) : '—'}</td>
                        <td className={`px-4 py-2.5 text-right tabular-nums ${over ? 'font-semibold text-red-600' : 'text-gray-600'}`}>
                          {it.actual ? formatCurrency(it.actual) : '—'}
                          {over && <AlertTriangle size={12} className="ml-1 inline align-[-1px]" />}
                        </td>
                        <td className="px-4 py-2.5 text-right tabular-nums text-emerald-700">{it.paid ? formatCurrency(it.paid) : '—'}</td>
                        <td className="px-4 py-2.5 text-right font-medium tabular-nums text-gray-900">{formatCurrency(itemBalance(it))}</td>
                        <td className="px-4 py-2.5 text-gray-500">{it.dueDate || '—'}</td>
                        <td className="px-4 py-2.5"><Badge variant={STATUS_VARIANT[it.status]}>{STATUS_LABEL[it.status]}</Badge></td>
                        {canEdit && (
                          <td className="px-4 py-2.5">
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openEdit(it)} aria-label="Edit item" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                              <button onClick={() => handleDelete(it)} aria-label="Delete item" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="divide-y divide-gray-100 sm:hidden">
                {group.rows.map((it) => {
                  const over = it.actual > 0 && it.estimated > 0 && it.actual > it.estimated;
                  return (
                    <div key={it.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">{it.name || '—'}</p>
                          {it.vendor && <p className="truncate text-xs text-gray-500">{it.vendor}</p>}
                        </div>
                        <Badge variant={STATUS_VARIANT[it.status]}>{STATUS_LABEL[it.status]}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div><span className="block text-gray-400">Committed</span><span className={`tabular-nums ${over ? 'font-semibold text-red-600' : 'text-gray-700'}`}>{formatCurrency(itemCommitted(it))}</span></div>
                        <div><span className="block text-gray-400">Paid</span><span className="tabular-nums text-emerald-700">{formatCurrency(it.paid || 0)}</span></div>
                        <div><span className="block text-gray-400">Balance</span><span className="font-medium tabular-nums text-gray-900">{formatCurrency(itemBalance(it))}</span></div>
                      </div>
                      {canEdit && (
                        <div className="mt-2 flex justify-end gap-1">
                          <button onClick={() => openEdit(it)} aria-label="Edit item" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><Pencil size={15} /></button>
                          <button onClick={() => handleDelete(it)} aria-label="Delete item" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / edit modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit budget item' : 'Add budget item'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="bd-cat" className="mb-1 block text-sm font-medium text-gray-700">Category</label>
              <select
                id="bd-cat" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-600/20"
              >
                {BUDGET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Item name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Sangeet stage decor" required />
          </div>
          <Input label="Vendor (optional)" value={form.vendor} onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))} placeholder="e.g. Blooms & Co." />
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Estimated" type="number" min="0" step="0.01" inputMode="decimal" value={form.estimated} onChange={(e) => setForm((f) => ({ ...f, estimated: e.target.value }))} placeholder="0" />
            <Input label="Actual / quoted" type="number" min="0" step="0.01" inputMode="decimal" value={form.actual} onChange={(e) => setForm((f) => ({ ...f, actual: e.target.value }))} placeholder="0" />
            <Input label="Paid so far" type="number" min="0" step="0.01" inputMode="decimal" value={form.paid} onChange={(e) => setForm((f) => ({ ...f, paid: e.target.value }))} placeholder="0" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Payment due date" type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
            <div>
              <label htmlFor="bd-status" className="mb-1 block text-sm font-medium text-gray-700">Status</label>
              <select
                id="bd-status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="min-h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-600/20"
              >
                {BUDGET_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="bd-notes" className="mb-1 block text-sm font-medium text-gray-700">Notes (optional)</label>
            <textarea
              id="bd-notes" rows={2} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-wine-600 focus:outline-none focus:ring-2 focus:ring-wine-600/20"
              placeholder="Deposit paid, contract signed, etc."
            />
          </div>
          <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
            <span className="text-gray-500">Balance due for this item: </span>
            <span className="font-semibold text-gray-900">{formatCurrency(itemBalance(form))}</span>
          </div>
          <AttachmentsSection
            weddingId={activeWedding?.id}
            item={editing ? items.find((i) => i.id === editing.id) || editing : null}
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add item'}</Button>
          </div>
        </form>
      </Modal>

      {/* Target modal */}
      <Modal open={targetOpen} onClose={() => setTargetOpen(false)} title="Set overall budget target" size="sm">
        <form onSubmit={handleSaveTarget} className="space-y-4">
          <Input
            label="Total budget target" type="number" min="0" step="0.01" inputMode="decimal"
            value={targetDraft} onChange={(e) => setTargetDraft(e.target.value)} placeholder="e.g. 50000" autoFocus
          />
          <p className="text-xs text-gray-500">We&apos;ll show how much of this you&apos;ve committed so far and what&apos;s left to allocate.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setTargetOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Save target</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentsSection({ weddingId, item }) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const fileInputRef = useRef(null);

  // New items must be saved first — there's no item id to key files to.
  if (!item?.id) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
        <span className="flex items-center gap-2">
          <Paperclip size={15} className="text-gray-400" />
          Save this item first, then reopen it to attach receipts or contracts.
        </span>
      </div>
    );
  }

  const attachments = item.attachments || [];

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      setProgress(0);
      try {
        await uploadBudgetAttachment(weddingId, item.id, file, setProgress);
        toast.success(`Attached ${file.name}`);
      } catch (err) {
        toast.error(err?.message || `Could not attach ${file.name}.`);
      }
    }
    setUploading(false);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemove = async (attachment) => {
    if (!window.confirm(`Remove "${attachment.name}"?`)) return;
    setBusyId(attachment.id);
    try {
      await removeBudgetAttachment(weddingId, item.id, attachment);
      toast.success('Attachment removed');
    } catch (err) {
      toast.error(err?.message || 'Could not remove the attachment.');
    } finally {
      setBusyId(null);
    }
  };

  const iconFor = (type) =>
    type?.startsWith('image/') ? ImageIcon : FileText;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <Paperclip size={15} className="text-gray-500" />
          Files <span className="font-normal text-gray-400">(receipts, contracts, quotes)</span>
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition hover:border-wine-400 hover:text-wine-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          {uploading ? 'Uploading…' : 'Attach file'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.webp,.heic,.gif,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*,application/pdf"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {uploading && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-wine-500 transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-xs text-gray-400">
          Nothing attached yet. Keep receipts and vendor contracts here so everything for this item lives in one place.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((att) => {
            const Icon = iconFor(att.type);
            return (
              <li
                key={att.id}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm animate-fade-in"
              >
                <Icon size={16} className="shrink-0 text-wine-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-800">{att.name}</p>
                  {att.size ? <p className="text-xs text-gray-400">{formatBytes(att.size)}</p> : null}
                </div>
                <a
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-wine-600"
                  title="Open"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  type="button"
                  onClick={() => handleRemove(att)}
                  disabled={busyId === att.id}
                  className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                  title="Remove"
                >
                  {busyId === att.id ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tint, iconTint }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-gradient-to-b ${tint} p-4 shadow-sm`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={iconTint} />
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold tabular-nums text-gray-900 sm:text-2xl">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function EmptyState({ canEdit, onAdd }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gradient-to-b from-wine-50/40 to-white p-10 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-wine-100 text-wine-700">
        <Wallet size={26} />
      </span>
      <h3 className="mt-4 text-base font-semibold text-gray-900">Start planning your budget</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
        Track estimates, vendor quotes, deposits, and balances across every part of your celebration — all in one place.
      </p>
      {canEdit && (
        <Button variant="primary" size="md" onClick={onAdd} className="mt-5">
          <Plus size={16} /> Add your first item
        </Button>
      )}
    </div>
  );
}
