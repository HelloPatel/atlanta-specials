import { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests, addGuest, updateGuest, deleteGuest, deleteGuestsBatch, importGuestsBatch, updateGuestsBatch } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { subscribeToSeating } from '../../services/seatingService';
import { Button, Input, Badge, Modal, useToast } from '../ui';
import { Search, Plus, Upload, Download, Trash2, Edit3 } from 'lucide-react';
import { parseFile, autoMapColumns, mapRowsToGuests, findDuplicates, exportGuestsToExcel, downloadGuestTemplate } from '../../utils/excelImport';
import { DIETARY_OPTIONS, SIDES, GUEST_TAGS, RSVP_STATUS } from '../../config/constants';

export default function GuestList() {
  const { activeWedding } = useWedding();
  const toast = useToast();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [filterSide, setFilterSide] = useState('all');
  const [filterDietary, setFilterDietary] = useState('all');
  const [filterTag, setFilterTag] = useState('all');
  const [filterRsvp, setFilterRsvp] = useState('all'); // all | responded | pending | accepted | declined
  const [selected, setSelected] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [sortField, setSortField] = useState('firstName');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const [editingGuest, setEditingGuest] = useState(null);
  const [inlineEdit, setInlineEdit] = useState(null); // {id, firstName, lastName}
  const [viewMode, setViewMode] = useState('family'); // family | list

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, setEvents);
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  // Build guest-to-table mapping from all event seatings
  const [tableMap, setTableMap] = useState({});
  useEffect(() => {
    if (!activeWedding || events.length === 0) return;
    // Subscribe to seating for the first event that has seating
    const eventId = events[0]?.id;
    if (!eventId) return;
    return subscribeToSeating(activeWedding.id, eventId, (data) => {
      const map = {};
      (data.tables || []).forEach((t) => {
        (t.assignedGuests || []).forEach((gId) => { map[gId] = t.name; });
      });
      setTableMap(map);
    });
  }, [activeWedding, events]);

  const filtered = useMemo(() => {
    const list = guests.filter((g) => {
      const searchable = `${g.firstName} ${g.lastName} ${g.familyName} ${g.email} ${g.phone} ${g.dietary} ${g.side} ${(g.tags || []).join(' ')} ${g.notes || ''}`.toLowerCase();
      if (search && !searchable.includes(search.toLowerCase())) return false;
      if (filterSide !== 'all' && g.side !== filterSide) return false;
      if (filterDietary !== 'all' && g.dietary !== filterDietary) return false;
      if (filterTag !== 'all' && !(g.tags || []).includes(filterTag)) return false;
      if (filterRsvp !== 'all') {
        const statuses = Object.values(g.rsvpStatus || {});
        if (filterRsvp === 'responded' && !statuses.some((s) => s === 'accepted' || s === 'declined')) return false;
        if (filterRsvp === 'pending' && statuses.some((s) => s === 'accepted' || s === 'declined')) return false;
        if (filterRsvp === 'accepted' && !statuses.includes('accepted')) return false;
        if (filterRsvp === 'declined' && !statuses.includes('declined')) return false;
      }
      return true;
    });
    // Sort
    list.sort((a, b) => {
      let aVal = (a[sortField] || '').toString().toLowerCase();
      let bVal = (b[sortField] || '').toString().toLowerCase();
      if (sortField === 'table') {
        aVal = tableMap[a.id] || 'zzz';
        bVal = tableMap[b.id] || 'zzz';
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [guests, search, filterSide, filterDietary, filterTag, filterRsvp, sortField, sortDir, tableMap]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedGuests = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Group the filtered guests into families for the visual "Families" view.
  // A "family" is a set of guests that share a familyName (case-insensitive).
  // Guests without a family are gathered into an "Individual guests" bucket.
  const familyGroups = useMemo(() => {
    const groups = new Map();
    const solo = [];
    filtered.forEach((g) => {
      const key = (g.familyName || '').trim();
      if (!key) { solo.push(g); return; }
      const k = key.toLowerCase();
      if (!groups.has(k)) groups.set(k, { name: key, members: [] });
      groups.get(k).members.push(g);
    });
    const list = [...groups.values()].sort((a, b) => a.name.localeCompare(b.name));
    // Sort members within a family by first name for a tidy read
    list.forEach((f) => f.members.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || '')));
    solo.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
    return { families: list, solo };
  }, [filtered]);

  // Reset page when filters change - use effect
  useEffect(() => { setPage(0); }, [search, filterSide, filterDietary, filterTag, filterRsvp]);

  const stats = useMemo(() => ({
    total: guests.length,
    bride: guests.filter((g) => g.side === 'bride').length,
    groom: guests.filter((g) => g.side === 'groom').length,
    families: new Set(guests.map((g) => g.familyName).filter(Boolean)).size,
  }), [guests]);

  // Detect potential duplicates within existing guest list
  const duplicates = useMemo(() => {
    const seen = new Map();
    const dupes = [];
    guests.forEach((g) => {
      const family = (g.familyName || '').toLowerCase().trim();
      // Within-family only: Indian guest lists reuse first and last names across
      // different families, so a bare name match would flag distinct people.
      if (!family) return;
      const key = `${(g.firstName || '').toLowerCase().trim()}_${(g.lastName || '').toLowerCase().trim()}_${family}`;
      if (seen.has(key)) {
        dupes.push({ original: seen.get(key), duplicate: g });
      } else {
        seen.set(key, g);
      }
    });
    return dupes;
  }, [guests]);

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((g) => g.id)));
    }
  };

  const toggleSelectMany = (ids) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} guests?`)) return;
    try {
      await deleteGuestsBatch(activeWedding.id, [...selected]);
      setSelected(new Set());
    } catch (err) {
      console.error('Bulk delete failed:', err);
      toast.error('Failed to delete some guests. Please try again.');
    }
  };

  if (!activeWedding) return null;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Guests" value={stats.total} />
        <StatCard label="Bride's Side" value={stats.bride} />
        <StatCard label="Groom's Side" value={stats.groom} />
        <StatCard label="Families" value={stats.families} />
      </div>

      {/* Quick filter chips */}
      {guests.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {GUEST_TAGS.filter((tag) => guests.some((g) => (g.tags || []).includes(tag))).map((tag) => {
            const count = guests.filter((g) => (g.tags || []).includes(tag)).length;
            const isActive = filterTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setFilterTag(isActive ? 'all' : tag)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  isActive ? 'bg-wine-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tag}
                <span className={`text-[10px] ${isActive ? 'text-wine-200' : 'text-gray-400'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Toolbar */}
      <div className="space-y-2.5">
        {/* Filters row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search guests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm focus:border-wine-600 focus:ring-1 focus:ring-wine-600"
            />
          </div>

          {/* Scrollable filter strip on mobile, inline on desktop */}
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:contents sm:overflow-visible sm:px-0 sm:pb-0">
            {/* View toggle: family cards vs flat list */}
            <div className="inline-flex flex-shrink-0 rounded-lg border border-gray-300 bg-gray-50 p-0.5">
              <button
                onClick={() => setViewMode('family')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  viewMode === 'family' ? 'bg-white text-wine-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >Families</button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  viewMode === 'list' ? 'bg-white text-wine-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >List</button>
            </div>

            <select value={filterSide} onChange={(e) => setFilterSide(e.target.value)} className="flex-shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="all">All Sides</option>
              <option value="bride">Bride's Side</option>
              <option value="groom">Groom's Side</option>
            </select>

            <select value={filterDietary} onChange={(e) => setFilterDietary(e.target.value)} className="hidden flex-shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:block">
              <option value="all">All Dietary</option>
              {DIETARY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>

            <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} className="hidden flex-shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:block">
              <option value="all">All Tags</option>
              {GUEST_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>

            <select value={filterRsvp} onChange={(e) => setFilterRsvp(e.target.value)} className="hidden flex-shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm sm:block">
              <option value="all">All RSVP</option>
              <option value="responded">Responded</option>
              <option value="pending">Not Responded</option>
              <option value="accepted">Accepted</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* Actions row — neat single scrollable row on mobile, wraps on desktop */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <Button onClick={() => setShowAddModal(true)} className="flex-shrink-0 whitespace-nowrap"><Plus size={16} /> Add Guest</Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)} className="flex-shrink-0 whitespace-nowrap"><Upload size={16} /> Import</Button>
          <Button variant="outline" onClick={async () => {
            const input = prompt('Enter guest names (comma-separated):\nExample: Arjun Patel, Anjali Shah, Rohan Mehta');
            if (!input) return;
            const names = input.split(',').map((n) => n.trim()).filter(Boolean);
            const newGuests = names.map((n) => {
              const parts = n.split(/\s+/);
              const firstName = parts[0] || '';
              const lastName = parts.slice(1).join(' ') || '';
              return { firstName, lastName, side: 'bride', dietary: 'vegetarian', tags: [] };
            });
            await importGuestsBatch(activeWedding.id, newGuests);
            toast.success(`Added ${newGuests.length} guests`);
          }} className="flex-shrink-0 whitespace-nowrap" title="Quickly add multiple guests by name">
            <Plus size={16} /> Quick Add
          </Button>
          <Button variant="outline" onClick={downloadGuestTemplate} className="flex-shrink-0 whitespace-nowrap">
            <Download size={16} /> Template
          </Button>
          <Button variant="outline" onClick={() => exportGuestsToExcel(guests)} className="flex-shrink-0 whitespace-nowrap">
            <Download size={16} /> Export
          </Button>
        </div>
      </div>

      {/* Duplicate warning */}
      {duplicates.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm font-medium text-amber-800 mb-2">⚠️ {duplicates.length} potential duplicate{duplicates.length > 1 ? 's' : ''} found</p>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {duplicates.slice(0, 5).map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-amber-700">
                  {d.duplicate.firstName} {d.duplicate.lastName}
                  {d.duplicate.familyName && ` (${d.duplicate.familyName})`}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Remove duplicate "${d.duplicate.firstName} ${d.duplicate.lastName}"?`)) {
                      deleteGuest(activeWedding.id, d.duplicate.id);
                      toast.success('Duplicate removed');
                    }
                  }}
                  className="text-red-600 hover:text-red-800 font-medium"
                >Remove</button>
              </div>
            ))}
            {duplicates.length > 5 && <p className="text-xs text-amber-600">...and {duplicates.length - 5} more</p>}
          </div>
        </div>
      )}

      {/* Bulk actions — floating island, not glued to the top */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 animate-[fadeUp_0.4s_cubic-bezier(0.32,0.72,0,1)]">
          <div className="flex max-w-[calc(100vw-1.5rem)] flex-nowrap items-center gap-2 overflow-x-auto rounded-full border border-white/60 bg-white/85 px-4 py-2.5 shadow-[0_8px_40px_rgba(76,29,49,0.22)] backdrop-blur-xl md:gap-3">
          <span className="whitespace-nowrap text-sm font-semibold text-wine-800">{selected.size} selected</span>
          <select
            defaultValue=""
            onChange={async (e) => {
              const side = e.target.value;
              if (!side) return;
              const updates = [...selected].map((id) => ({ id, side }));
              await updateGuestsBatch(activeWedding.id, updates);
              toast.success(`Moved ${selected.size} guests to ${side}'s side`);
              e.target.value = '';
            }}
            className="rounded-md border border-wine-200 bg-white px-2 py-1 text-xs"
          >
            <option value="">Change Side...</option>
            <option value="bride">Bride's Side</option>
            <option value="groom">Groom's Side</option>
          </select>
          <select
            defaultValue=""
            onChange={async (e) => {
              const dietary = e.target.value;
              if (!dietary) return;
              const updates = [...selected].map((id) => ({ id, dietary }));
              await updateGuestsBatch(activeWedding.id, updates);
              toast.success(`Updated dietary for ${selected.size} guests`);
              e.target.value = '';
            }}
            className="rounded-md border border-wine-200 bg-white px-2 py-1 text-xs"
          >
            <option value="">Set Dietary...</option>
            {DIETARY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select
            defaultValue=""
            onChange={async (e) => {
              const tag = e.target.value;
              if (!tag) return;
              const selectedGuests = guests.filter((g) => selected.has(g.id));
              const updates = selectedGuests.map((g) => ({
                id: g.id,
                tags: [...new Set([...(g.tags || []), tag])],
              }));
              await updateGuestsBatch(activeWedding.id, updates);
              toast.success(`Added "${tag}" tag to ${selected.size} guests`);
              e.target.value = '';
            }}
            className="rounded-md border border-wine-200 bg-white px-2 py-1 text-xs"
          >
            <option value="">Add Tag...</option>
            {GUEST_TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {events.length > 0 && (
            <select
              defaultValue=""
              onChange={async (e) => {
                const eventId = e.target.value;
                if (!eventId) return;
                const event = events.find((ev) => ev.id === eventId);
                if (!event) return;
                const existingIds = event.guestIds || [];
                const newIds = [...new Set([...existingIds, ...selected])];
                const { updateEvent } = await import('../../services/eventService');
                await updateEvent(activeWedding.id, eventId, { guestIds: newIds, inviteAll: false });
                toast.success(`Invited ${selected.size} guests to ${event.name}`);
                e.target.value = '';
              }}
              className="rounded-md border border-wine-200 bg-white px-2 py-1 text-xs"
            >
              <option value="">Invite to Event...</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          )}
          <Button variant="danger" size="sm" onClick={handleBulkDelete}>
            <Trash2 size={14} /> Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      {/* Guest list — Families view (grouped cards) or List view (table) */}
      {viewMode === 'family' ? (
        <FamilyView
          familyGroups={familyGroups}
          events={events}
          selected={selected}
          toggleSelect={toggleSelect}
          toggleSelectMany={toggleSelectMany}
          onEdit={setEditingGuest}
          tableMap={tableMap}
          totalGuests={guests.length}
        />
      ) : (
      <>
      {/* Guest list — table on desktop, cards on mobile */}
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} className="rounded" />
              </th>
              <SortHeader field="firstName" label="Name" sortField={sortField} sortDir={sortDir} onSort={(f) => { setSortDir(sortField === f && sortDir === 'asc' ? 'desc' : 'asc'); setSortField(f); }} />
              <SortHeader field="familyName" label="Family" sortField={sortField} sortDir={sortDir} onSort={(f) => { setSortDir(sortField === f && sortDir === 'asc' ? 'desc' : 'asc'); setSortField(f); }} />
              <SortHeader field="side" label="Side" sortField={sortField} sortDir={sortDir} onSort={(f) => { setSortDir(sortField === f && sortDir === 'asc' ? 'desc' : 'asc'); setSortField(f); }} />
              <SortHeader field="dietary" label="Dietary" sortField={sortField} sortDir={sortDir} onSort={(f) => { setSortDir(sortField === f && sortDir === 'asc' ? 'desc' : 'asc'); setSortField(f); }} />
              <th className="px-4 py-3 text-left font-medium text-gray-600">Tags</th>
              <SortHeader field="table" label="Table" sortField={sortField} sortDir={sortDir} onSort={(f) => { setSortDir(sortField === f && sortDir === 'asc' ? 'desc' : 'asc'); setSortField(f); }} />
              <th className="px-4 py-3 text-left font-medium text-gray-600">RSVP</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  {guests.length === 0 ? 'No guests yet. Add your first guest or import from Excel.' : 'No guests match your filters.'}
                </td>
              </tr>
            ) : (
              paginatedGuests.map((guest) => (
                <tr key={guest.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(guest.id)} onChange={() => toggleSelect(guest.id)} className="rounded" />
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {inlineEdit?.id === guest.id ? (
                      <form className="flex gap-1" onSubmit={async (e) => {
                        e.preventDefault();
                        await updateGuest(activeWedding.id, guest.id, { firstName: inlineEdit.firstName, lastName: inlineEdit.lastName });
                        setInlineEdit(null);
                        toast.success('Name updated');
                      }}>
                        <input className="border rounded px-1 py-0.5 text-sm w-20" value={inlineEdit.firstName}
                          onChange={(e) => setInlineEdit({ ...inlineEdit, firstName: e.target.value })} autoFocus />
                        <input className="border rounded px-1 py-0.5 text-sm w-20" value={inlineEdit.lastName}
                          onChange={(e) => setInlineEdit({ ...inlineEdit, lastName: e.target.value })} />
                        <button type="submit" className="text-green-600 text-xs">✓</button>
                        <button type="button" className="text-red-500 text-xs" onClick={() => setInlineEdit(null)}>✗</button>
                      </form>
                    ) : (
                      <span className="cursor-pointer hover:text-wine-700 hover:underline" onClick={() => setEditingGuest(guest)} onDoubleClick={(e) => { e.stopPropagation(); setInlineEdit({ id: guest.id, firstName: guest.firstName, lastName: guest.lastName }); }} title={guest.notes || 'Click to edit'}>
                        {guest.firstName} {guest.lastName}
                        {guest.notes && <span className="ml-1 text-xs text-gray-400">📝</span>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{guest.familyName || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={guest.side === 'bride' ? 'rose' : 'info'}>{guest.side}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{guest.dietary || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(guest.tags || []).map((tag) => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {tableMap[guest.id] ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-wine-50 text-wine-700 font-medium">
                        {tableMap[guest.id]}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {(() => {
                      const statuses = Object.values(guest.rsvpStatus || {});
                      if (statuses.length === 0) return <span className="text-xs text-gray-400">—</span>;
                      const accepted = statuses.filter((s) => s === 'accepted').length;
                      const declined = statuses.filter((s) => s === 'declined').length;
                      const pending = statuses.filter((s) => s === 'pending').length;
                      return (
                        <div className="flex gap-1 text-xs">
                          {accepted > 0 && <span className="text-green-600" title={`${accepted} accepted`}>✓{accepted}</span>}
                          {declined > 0 && <span className="text-red-500" title={`${declined} declined`}>✗{declined}</span>}
                          {pending > 0 && <span className="text-gray-400" title={`${pending} pending`}>?{pending}</span>}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={async () => {
                          await updateGuest(activeWedding.id, guest.id, { checkedIn: !guest.checkedIn });
                          toast.success(guest.checkedIn ? 'Checked out' : 'Checked in ✓');
                        }}
                        className={`rounded p-1.5 transition-colors ${guest.checkedIn ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                        title={guest.checkedIn ? 'Checked in. Click to undo' : 'Mark as arrived'}
                      >
                        {guest.checkedIn ? '✓' : '○'}
                      </button>
                      <button onClick={() => setEditingGuest(guest)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Edit3 size={16} />
                      </button>
                      <button onClick={() => { if (confirm('Delete this guest?')) deleteGuest(activeWedding.id, guest.id); }} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <span className="text-xs text-gray-500">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >← Prev</button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1 rounded-lg text-xs font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
              >Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-12 text-center text-gray-400 text-sm">
            {guests.length === 0 ? 'No guests yet. Tap + to add your first guest.' : 'No guests match your filters.'}
          </div>
        ) : (
          paginatedGuests.map((guest) => (
            <div key={guest.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center gap-3 active:scale-[0.98] transition-transform">
              <input type="checkbox" checked={selected.has(guest.id)} onChange={() => toggleSelect(guest.id)} className="rounded flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{guest.firstName} {guest.lastName}</p>
                <p className="text-xs text-gray-500 truncate">
                  {guest.familyName || 'No family'} · <span className="capitalize">{guest.side}</span>
                  {guest.dietary && guest.dietary !== 'vegetarian' ? ` · ${guest.dietary}` : ''}
                  {tableMap[guest.id] ? ` · 📍${tableMap[guest.id]}` : ''}
                </p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => setEditingGuest(guest)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => { if (confirm('Delete?')) deleteGuest(activeWedding.id, guest.id); }} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-gray-500">
              {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 disabled:opacity-40 active:scale-95"
              >←</button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 disabled:opacity-40 active:scale-95"
              >→</button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* Modals */}
      <GuestFormModal
        open={showAddModal || !!editingGuest}
        onClose={() => { setShowAddModal(false); setEditingGuest(null); }}
        guest={editingGuest}
        weddingId={activeWedding.id}
        events={events}
      />
      <ImportModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        weddingId={activeWedding.id}
        existingGuests={guests}
      />
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

// ─── Families view ─────────────────────────────────────────────────────────
// Groups guests into family cards with a per-event attendance grid so it's
// instantly clear who is coming to what — everyone to everything, one person
// to one event, or only a single member from the whole family.

const STATUS_META = {
  accepted: { dot: 'bg-emerald-500', ring: 'ring-emerald-500/30', label: 'Coming' },
  declined: { dot: 'bg-rose-400', ring: 'ring-rose-400/30', label: 'Not coming' },
  pending:  { dot: 'bg-amber-400', ring: 'ring-amber-400/30', label: 'Awaiting reply' },
};

function guestEventStatus(guest, event) {
  const invited = event.inviteAll || (event.guestIds || []).includes(guest.id);
  if (!invited) return 'not-invited';
  return guest.rsvpStatus?.[event.id] || 'pending';
}

function familyAttendanceSummary(members, events) {
  if (!events.length) return null;
  const totalEvents = events.length;
  const per = members.map((m) => {
    const statuses = events.map((ev) => guestEventStatus(m, ev));
    const invited = statuses.filter((s) => s !== 'not-invited').length;
    const accepted = statuses.filter((s) => s === 'accepted').length;
    const declined = statuses.filter((s) => s === 'declined').length;
    return { m, invited, accepted, declined };
  });
  const coming = per.filter((p) => p.accepted > 0);
  if (per.every((p) => p.invited === totalEvents && p.accepted === totalEvents)) {
    return { tone: 'all', text: totalEvents === 1 ? 'Everyone attending' : 'Everyone attending all events' };
  }
  if (coming.length === 0 && per.some((p) => p.declined > 0)) {
    return { tone: 'none', text: per.every((p) => p.declined > 0) ? 'No one attending' : 'Awaiting replies' };
  }
  if (coming.length === 0) return { tone: 'pending', text: 'Awaiting replies' };
  if (coming.length === 1) {
    const only = coming[0];
    const evName = totalEvents === 1 ? '' : ` (${only.accepted}/${totalEvents} events)`;
    return { tone: 'partial', text: `Only ${only.m.firstName} attending${evName}` };
  }
  return { tone: 'partial', text: `${coming.length} of ${members.length} attending` };
}

const SUMMARY_TONE = {
  all:     'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  partial: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  none:    'bg-rose-50 text-rose-600 ring-rose-500/15',
  pending: 'bg-gray-100 text-gray-500 ring-gray-500/10',
};

function StatusDot({ status }) {
  if (status === 'not-invited') {
    return <span className="inline-block h-2 w-2 rounded-full bg-gray-200" title="Not invited" />;
  }
  const meta = STATUS_META[status];
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ring-2 ${meta.dot} ${meta.ring}`} title={meta.label} />;
}

function FamilyView({ familyGroups, events, selected, toggleSelect, toggleSelectMany, onEdit, tableMap, totalGuests }) {
  const { families, solo } = familyGroups;

  if (totalGuests === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-400">
        No guests yet. Add your first guest or import from Excel to see them grouped by family.
      </div>
    );
  }
  if (families.length === 0 && solo.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center text-gray-400">
        No guests match your filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      {events.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-gray-500">
          <span className="font-medium text-gray-600">Attendance:</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" /> Coming</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-amber-400/30" /> Awaiting reply</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-rose-400 ring-2 ring-rose-400/30" /> Not coming</span>
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gray-200" /> Not invited</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {families.map((family, i) => (
          <FamilyCard
            key={family.name}
            family={family}
            index={i}
            events={events}
            selected={selected}
            toggleSelect={toggleSelect}
            toggleSelectMany={toggleSelectMany}
            onEdit={onEdit}
            tableMap={tableMap}
          />
        ))}
      </div>

      {/* Individual guests (no family assigned) */}
      {solo.length > 0 && (
        <FamilyCard
          family={{ name: 'Individual guests', members: solo }}
          index={families.length}
          events={events}
          selected={selected}
          toggleSelect={toggleSelect}
          toggleSelectMany={toggleSelectMany}
          onEdit={onEdit}
          tableMap={tableMap}
          isSolo
        />
      )}
    </div>
  );
}

function FamilyCard({ family, index, events, selected, toggleSelect, toggleSelectMany, onEdit, tableMap, isSolo }) {
  const { name, members } = family;
  const memberIds = members.map((m) => m.id);
  const allSelected = memberIds.length > 0 && memberIds.every((id) => selected.has(id));
  const someSelected = memberIds.some((id) => selected.has(id));
  const summary = familyAttendanceSummary(members, events);
  const side = members[0]?.side;
  // Alternating warm/cool shell tint keeps a long list of families readable.
  const shellTint = index % 2 === 0 ? 'bg-ivory-100/70' : 'bg-wine-50/40';

  return (
    <div className={`rounded-[1.75rem] p-1.5 ring-1 ring-black/5 ${shellTint}`}>
      <div className="rounded-[calc(1.75rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
            onChange={() => toggleSelectMany(memberIds)}
            className="h-4 w-4 flex-shrink-0 rounded"
            title={allSelected ? 'Deselect family' : 'Select whole family'}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate font-serif text-base font-semibold text-gray-900">{name}</h3>
              {!isSolo && side && (
                <Badge variant={side === 'bride' ? 'rose' : 'info'} className="flex-shrink-0 capitalize">{side}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-400">{members.length} {members.length === 1 ? 'guest' : 'guests'}</p>
          </div>
          {summary && (
            <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${SUMMARY_TONE[summary.tone]}`}>
              {summary.text}
            </span>
          )}
        </div>

        {/* Member × event attendance grid */}
        <div className="overflow-x-auto border-t border-gray-100">
          <table className="w-full text-sm">
            {events.length > 0 && (
              <thead>
                <tr className="text-[10px] uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-2 text-left font-medium">Guest</th>
                  {events.map((ev) => (
                    <th key={ev.id} className="px-2 py-2 text-center font-medium" title={ev.name}>
                      <span className="mx-auto block max-w-[64px] truncate">{ev.name}</span>
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody className="divide-y divide-gray-50">
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="group cursor-pointer transition-colors hover:bg-wine-50/40"
                  onClick={() => onEdit(m)}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(m.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleSelect(m.id)}
                        className="h-4 w-4 flex-shrink-0 rounded"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900 group-hover:text-wine-700">
                          {m.firstName} {m.lastName}
                          {m.plusOne && <span className="ml-1 text-[10px] font-normal text-gray-400">+1</span>}
                        </p>
                        <p className="truncate text-[11px] text-gray-400">
                          {m.relation || (m.dietary && m.dietary !== 'vegetarian' ? m.dietary : '')}
                          {tableMap[m.id] ? `${m.relation ? ' · ' : ''}${tableMap[m.id]}` : ''}
                        </p>
                      </div>
                    </div>
                  </td>
                  {events.map((ev) => (
                    <td key={ev.id} className="px-2 py-2.5 text-center">
                      <StatusDot status={guestEventStatus(m, ev)} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Guest Form Modal ──────────────────────────────────────────────────────

function GuestFormModal({ open, onClose, guest, weddingId, events }) {
  const isEdit = !!guest;
  const toast = useToast();
  const [form, setForm] = useState({});

  useEffect(() => {
    if (guest) {
      setForm({ ...guest });
    } else {
      setForm({
        firstName: '', lastName: '', email: '', phone: '',
        familyName: '', side: 'bride', relation: '', dietary: 'vegetarian',
        dietaryNotes: '', plusOne: false, plusOneName: '', tags: [],
        needsHotel: false, travelFrom: '', notes: '',
      });
    }
  }, [guest, open]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  // Per-event RSVP editing (three-state: accepted / declined / cleared).
  // Admin-entered changes are tagged as a manual source.
  const setEventRsvp = (eventId, status) => {
    setForm((f) => {
      const rsvpStatus = { ...(f.rsvpStatus || {}) };
      if (status === null) delete rsvpStatus[eventId];
      else rsvpStatus[eventId] = status;
      return { ...f, rsvpStatus, rsvpMethod: 'manual', rsvpUpdatedAt: Date.now() };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    try {
      if (isEdit) {
        await updateGuest(weddingId, guest.id, form);
      } else {
        await addGuest(weddingId, form);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save guest:', err);
      toast.error('Failed to save guest. Please try again.');
    }
  };

  const toggleTag = (tag) => {
    const tags = form.tags || [];
    update('tags', tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Guest' : 'Add Guest'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input label="First Name" value={form.firstName || ''} onChange={(e) => update('firstName', e.target.value)} required />
          <Input label="Last Name" value={form.lastName || ''} onChange={(e) => update('lastName', e.target.value)} required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input label="Email" type="email" value={form.email || ''} onChange={(e) => update('email', e.target.value)} />
          <Input label="Phone" value={form.phone || ''} onChange={(e) => update('phone', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <Input label="Family Name" value={form.familyName || ''} onChange={(e) => update('familyName', e.target.value)} placeholder="e.g. The Patel Family" />
          <Input label="Relation" value={form.relation || ''} onChange={(e) => update('relation', e.target.value)} placeholder="e.g. Cousin, Uncle" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Side</label>
            <select value={form.side || 'bride'} onChange={(e) => update('side', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="bride">Bride's Side</option>
              <option value="groom">Groom's Side</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dietary</label>
            <select value={form.dietary || 'vegetarian'} onChange={(e) => update('dietary', e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              {DIETARY_OPTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
            <input type="checkbox" checked={form.plusOne || false} onChange={(e) => update('plusOne', e.target.checked)} className="rounded w-5 h-5" />
            Plus One
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
            <input type="checkbox" checked={form.needsHotel || false} onChange={(e) => update('needsHotel', e.target.checked)} className="rounded w-5 h-5" />
            Needs Hotel
          </label>
        </div>

        {form.plusOne && (
          <Input label="Plus One Name" value={form.plusOneName || ''} onChange={(e) => update('plusOneName', e.target.value)} />
        )}

        <Input label="Traveling From" value={form.travelFrom || ''} onChange={(e) => update('travelFrom', e.target.value)} placeholder="City" />

        {/* Per-event RSVP */}
        {events.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">RSVP by event</label>
            <div className="space-y-1.5">
              {events.map((ev) => {
                const status = (form.rsvpStatus || {})[ev.id] || null;
                const opts = [
                  { v: 'accepted', label: 'Yes', on: 'bg-green-600 text-white', off: 'text-green-700 hover:bg-green-50' },
                  { v: 'declined', label: 'No', on: 'bg-red-600 text-white', off: 'text-red-700 hover:bg-red-50' },
                  { v: null, label: '—', on: 'bg-gray-500 text-white', off: 'text-gray-500 hover:bg-gray-100' },
                ];
                return (
                  <div key={ev.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
                    <span className="text-sm text-gray-700 truncate">{ev.name}</span>
                    <div className="flex overflow-hidden rounded-lg border border-gray-200 flex-shrink-0">
                      {opts.map((o, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEventRsvp(ev.id, o.v)}
                          className={`px-3 py-1 text-xs font-semibold transition-colors ${status === o.v ? o.on : `bg-white ${o.off}`} ${i > 0 ? 'border-l border-gray-200' : ''}`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {GUEST_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  (form.tags || []).includes(tag) ? 'bg-wine-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <Input label="Notes" value={form.notes || ''} onChange={(e) => update('notes', e.target.value)} />

        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Add Guest'}</Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Import Modal ──────────────────────────────────────────────────────────

function ImportModal({ open, onClose, weddingId, existingGuests }) {
  const toast = useToast();
  const [step, setStep] = useState('upload'); // upload → map → preview → done
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [mappedGuests, setMappedGuests] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const guestFields = [
    { value: '', label: '— Skip —' },
    { value: 'firstName', label: 'First Name' },
    { value: 'lastName', label: 'Last Name' },
    { value: '_fullName', label: 'Full Name (split auto)' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'familyName', label: 'Family' },
    { value: 'side', label: 'Side (Bride/Groom)' },
    { value: 'relation', label: 'Relation' },
    { value: 'tableNumber', label: 'Table #' },
    { value: 'dietary', label: 'Dietary' },
    { value: 'notes', label: 'Notes' },
    { value: 'plusOne', label: 'Plus One (Yes/No)' },
    { value: '_tags', label: 'Tags (comma-sep)' },
  ];

  const handleFile = async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    try {
      const result = await parseFile(f);
      setParsed(result);
      const autoMap = autoMapColumns(result.headers);
      setColumnMapping(autoMap);
      setStep('map');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleMapDone = () => {
    const guests = mapRowsToGuests(parsed.rows, columnMapping);
    setMappedGuests(guests);
    const dupes = findDuplicates(existingGuests, guests);
    setDuplicates(dupes);
    setStep('preview');
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Filter out duplicates
      const dupeIndices = new Set(duplicates.map((d) => d.index));
      const toImport = mappedGuests.filter((_, i) => !dupeIndices.has(i));
      const count = await importGuestsBatch(weddingId, toImport);
      setResult({ success: true, count });
      setStep('done');
    } catch (err) {
      setResult({ success: false, error: err.message });
      setStep('done');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setStep('upload');
    setFile(null);
    setParsed(null);
    setColumnMapping({});
    setMappedGuests([]);
    setDuplicates([]);
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Import Guests" size="xl">
      {step === 'upload' && (
        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-wine-50">
            <Upload size={28} className="text-wine-700" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel or CSV</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Upload your guest list from Excel (.xlsx) or CSV. We'll auto-detect columns like Name, Email, Family, Side, and Table #.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-wine-700 px-6 py-3 text-sm font-medium text-white hover:bg-wine-800">
            <Upload size={16} /> Choose File
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} className="hidden" />
          </label>
        </div>
      )}

      {step === 'map' && parsed && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Found <strong>{parsed.rows.length}</strong> guests with <strong>{parsed.headers.length}</strong> columns.
            Map each column to a guest field:
          </p>
          <div className="max-h-[50vh] overflow-y-auto space-y-2">
            {parsed.headers.map((header) => (
              <div key={header} className="flex items-center gap-4">
                <span className="w-40 text-sm font-medium text-gray-700 truncate">{header}</span>
                <span className="text-gray-400">→</span>
                <select
                  value={columnMapping[header] || ''}
                  onChange={(e) => setColumnMapping((m) => ({ ...m, [header]: e.target.value || undefined }))}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {guestFields.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={reset}>Back</Button>
            <Button onClick={handleMapDone}>Preview Import</Button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Ready to import <strong>{mappedGuests.length - duplicates.length}</strong> guests.
            {duplicates.length > 0 && <span className="text-amber-600"> {duplicates.length} duplicates will be skipped.</span>}
          </p>
          <div className="max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Family</th>
                  <th className="px-3 py-2 text-left">Side</th>
                  <th className="px-3 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mappedGuests.slice(0, 50).map((g, i) => {
                  const isDupe = duplicates.some((d) => d.index === i);
                  return (
                    <tr key={i} className={isDupe ? 'bg-amber-50' : ''}>
                      <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2">{g.firstName} {g.lastName}</td>
                      <td className="px-3 py-2 text-gray-600">{g.familyName || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{g.side || '—'}</td>
                      <td className="px-3 py-2">
                        {isDupe ? <Badge variant="warning">Duplicate</Badge> : <Badge variant="success">New</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {mappedGuests.length > 50 && (
              <p className="text-xs text-gray-400 text-center py-2">Showing first 50 of {mappedGuests.length}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setStep('map')}>Back</Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? 'Importing...' : `Import ${mappedGuests.length - duplicates.length} Guests`}
            </Button>
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="text-center py-8">
          {result.success ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Complete</h3>
              <p className="text-sm text-gray-500 mb-6">{result.count} guests imported successfully.</p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <span className="text-2xl">❌</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Import Failed</h3>
              <p className="text-sm text-red-600 mb-6">{result.error}</p>
            </>
          )}
          <Button onClick={handleClose}>Done</Button>
        </div>
      )}
    </Modal>
  );
}

function SortHeader({ field, label, sortField, sortDir, onSort }) {
  const isActive = sortField === field;
  return (
    <th
      className="px-4 py-3 text-left font-medium text-gray-600 cursor-pointer select-none hover:text-gray-900 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && <span className="text-wine-600">{sortDir === 'asc' ? '↑' : '↓'}</span>}
      </span>
    </th>
  );
}
