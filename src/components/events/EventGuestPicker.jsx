import { useMemo, useState } from 'react';
import { Search, Check, Users } from 'lucide-react';
import { GUEST_TAGS } from '../../config/constants';

/**
 * Reusable picker for choosing which guests are invited to an event.
 * Value is an array of guest ids; onChange receives the next array.
 * Includes quick-add chips (by side and by tag) plus a searchable list,
 * so building a per-event invite list stays fast even with hundreds of guests.
 */
export default function EventGuestPicker({ guests = [], value = [], onChange }) {
  const [search, setSearch] = useState('');
  const selected = useMemo(() => new Set(value), [value]);

  const fullName = (g) => `${g.firstName || ''} ${g.lastName || ''}`.trim();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = [...guests].sort((a, b) => fullName(a).localeCompare(fullName(b)));
    if (!q) return list;
    return list.filter((g) =>
      `${fullName(g)} ${g.familyName || ''} ${(g.tags || []).join(' ')}`.toLowerCase().includes(q),
    );
  }, [guests, search]);

  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  const addMany = (ids) => {
    const next = new Set(selected);
    ids.forEach((id) => next.add(id));
    onChange([...next]);
  };

  // Quick-add groups: sides + any tag that at least one guest has.
  const quickGroups = useMemo(() => {
    const groups = [];
    const brideIds = guests.filter((g) => g.side === 'bride').map((g) => g.id);
    const groomIds = guests.filter((g) => g.side === 'groom').map((g) => g.id);
    if (brideIds.length) groups.push({ key: 'bride', label: `Bride's side (${brideIds.length})`, ids: brideIds });
    if (groomIds.length) groups.push({ key: 'groom', label: `Groom's side (${groomIds.length})`, ids: groomIds });
    GUEST_TAGS.forEach((tag) => {
      const ids = guests.filter((g) => (g.tags || []).includes(tag)).map((g) => g.id);
      if (ids.length) groups.push({ key: `tag-${tag}`, label: `${tag} (${ids.length})`, ids });
    });
    return groups;
  }, [guests]);

  const allShownSelected = filtered.length > 0 && filtered.every((g) => selected.has(g.id));

  if (guests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
        Add guests first, then choose who's invited to this event.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Quick-add chips */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-gray-500">Quick add</p>
        <div className="flex flex-wrap gap-1.5">
          {quickGroups.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => addMany(group.ids)}
              className="rounded-full border border-wine-200 bg-wine-50 px-2.5 py-1 text-xs font-medium text-wine-700 transition-colors hover:bg-wine-100"
            >
              + {group.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search + counts */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search guests…"
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1 font-medium text-gray-600">
          <Users size={12} /> {selected.size} of {guests.length} invited
        </span>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => addMany(filtered.map((g) => g.id))}
            className="font-medium text-wine-700 hover:text-wine-800"
          >
            Select all shown
          </button>
          <button
            type="button"
            onClick={() => onChange(value.filter((id) => !filtered.some((g) => g.id === id)))}
            className="font-medium text-gray-500 hover:text-gray-700"
          >
            Clear shown
          </button>
        </div>
      </div>

      {/* Guest list */}
      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-gray-100 p-1.5">
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-gray-400">No guests match “{search}”.</p>
        )}
        {filtered.map((g) => {
          const isSel = selected.has(g.id);
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => toggle(g.id)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                isSel ? 'bg-wine-50 text-wine-900' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="min-w-0 truncate">
                {fullName(g) || 'Unnamed guest'}
                {g.familyName && <span className="ml-1 text-xs text-gray-400">· {g.familyName}</span>}
              </span>
              <span
                className={`flex size-5 flex-shrink-0 items-center justify-center rounded-md border ${
                  isSel ? 'border-wine-600 bg-wine-600 text-white' : 'border-gray-300 bg-white'
                }`}
              >
                {isSel && <Check size={13} />}
              </span>
            </button>
          );
        })}
      </div>
      {allShownSelected && filtered.length > 0 && (
        <p className="text-center text-xs text-gray-400">All shown guests are invited.</p>
      )}
    </div>
  );
}
