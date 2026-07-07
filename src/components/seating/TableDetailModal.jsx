import { useEffect, useMemo, useState } from 'react';
import { Modal } from '../ui';
import { ArrowRight, ArrowLeft, Users, X, ArrowLeftRight } from 'lucide-react';
import { isIndividualSeat } from './seatingSeat';

const DIETARY_ICONS = {
  vegetarian: '🥬',
  vegan: '🌱',
  'non-veg': '🍗',
  jain: '🙏',
  other: '🍽️',
};

function resolveGuests(table, guests) {
  if (!table) return [];
  return (table.assignedGuests || [])
    .map((id) => guests.find((g) => g.id === id))
    .filter(Boolean);
}

function groupByFamily(list) {
  return list.reduce((acc, g) => {
    const key = g.familyName || '__individual';
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});
}

/**
 * Screen-scale modal that opens when a table is clicked. Shows the table's
 * guests grouped by family (readable at any canvas zoom) and lets you compare
 * two tables side by side and move/swap guests between them.
 */
export default function TableDetailModal({ tables, guests, tableId, onClose, onMoveGuest }) {
  const [compareId, setCompareId] = useState('');

  // Reset the comparison whenever a different table is opened.
  useEffect(() => { setCompareId(''); }, [tableId]);

  const table = tables.find((t) => t.id === tableId) || null;
  const compare = tables.find((t) => t.id === compareId) || null;

  const otherTables = useMemo(
    () => tables.filter((t) => t.id !== tableId && !isIndividualSeat(t)),
    [tables, tableId]
  );

  const guestsA = resolveGuests(table, guests);
  const guestsB = resolveGuests(compare, guests);

  if (!table) return null;

  return (
    <Modal open={!!tableId} onClose={onClose} title={compare ? 'Compare & swap tables' : table.name} size="lg">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Compare with</span>
          <select
            value={compareId}
            onChange={(e) => setCompareId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-wine-500 focus:outline-none focus:ring-1 focus:ring-wine-500"
          >
            <option value="">Choose a table…</option>
            {otherTables.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({(t.assignedGuests || []).length}/{t.capacity})
              </option>
            ))}
          </select>
          {compare && (
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <ArrowLeftRight size={13} /> use the arrows to move guests between tables
            </span>
          )}
        </div>

        <div className={`grid gap-4 ${compare ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          <TableColumn
            table={table}
            list={guestsA}
            direction={compare ? 'right' : null}
            onMove={(gid) => onMoveGuest(gid, compareId)}
            onUnseat={(gid) => onMoveGuest(gid, null)}
          />
          {compare && (
            <TableColumn
              table={compare}
              list={guestsB}
              direction="left"
              onMove={(gid) => onMoveGuest(gid, tableId)}
              onUnseat={(gid) => onMoveGuest(gid, null)}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

function TableColumn({ table, list, direction, onMove, onUnseat }) {
  const grouped = groupByFamily(list);
  const isOver = list.length > table.capacity;
  const families = Object.keys(grouped).filter((k) => k !== '__individual');
  const vegCount = list.filter((g) => ['vegetarian', 'jain', 'vegan'].includes(g.dietary)).length;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <div className="flex items-center justify-between rounded-t-2xl border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Users size={14} className="text-wine-600 shrink-0" />
          <span className="truncate text-sm font-semibold text-gray-800">{table.name}</span>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${isOver ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
          {list.length}/{table.capacity}
        </span>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto p-3">
        {list.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No guests seated yet.</p>
        )}
        {Object.entries(grouped).map(([family, members]) => (
          <div key={family}>
            {family !== '__individual' && (
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700">
                {family} family
              </div>
            )}
            <div className="space-y-1">
              {members.map((guest) => (
                <div key={guest.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50">
                  {direction === 'left' && (
                    <MoveButton icon={<ArrowLeft size={15} />} title="Move to other table" onClick={() => onMove(guest.id)} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800">
                      {guest.firstName} {guest.lastName}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      {guest.dietary && (
                        <span className="text-[11px] text-gray-500">
                          {DIETARY_ICONS[guest.dietary] || '🍽️'} {guest.dietary}
                        </span>
                      )}
                      {guest.side && (
                        <span className={`rounded px-1 py-0.5 text-[10px] ${guest.side === 'bride' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>
                          {guest.side}
                        </span>
                      )}
                      {(guest.tags || []).includes('VIP') && (
                        <span className="rounded bg-yellow-50 px-1 py-0.5 text-[10px] text-yellow-700">VIP</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => onUnseat(guest.id)}
                    className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500"
                    title="Remove from table"
                  >
                    <X size={14} />
                  </button>
                  {direction === 'right' && (
                    <MoveButton icon={<ArrowRight size={15} />} title="Move to other table" onClick={() => onMove(guest.id)} />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {list.length > 0 && (
        <div className="flex items-center gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 px-4 py-2 text-[11px] text-gray-500">
          {families.length > 0 && <span>{families.length} families</span>}
          {vegCount > 0 && <span>{vegCount} veg</span>}
        </div>
      )}
    </div>
  );
}

function MoveButton({ icon, title, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-wine-50 text-wine-600 transition-colors hover:bg-wine-600 hover:text-white"
    >
      {icon}
    </button>
  );
}
