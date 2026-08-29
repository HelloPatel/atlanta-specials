import { useState, useEffect, useMemo, useCallback } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { saveSeating, subscribeToSeating } from '../../services/seatingService';
import { TABLE_PRESETS } from '../../config/constants';
import { Button, Modal } from '../ui';
import { useToast } from '../ui/Toast';
import { evaluateSeatingRules } from './seatingRules';
import { autoSuggestSeating } from './seatingAutoSuggest';
import { isIndividualSeat } from './seatingSeat';
import {
  assignGuestWithoutDragging,
  getMobileLayoutBounds,
  getNextLockedTablePosition,
} from './mobileSeating';
import {
  VENUE_LAYOUTS,
  generateIndianWeddingLayout,
  generateMehendiLayout,
  generateReceptionLayout,
} from './seatingLayouts';
import {
  AlertTriangle,
  Cake,
  Camera,
  Check,
  CircleDot,
  DoorOpen,
  Edit3,
  Gift,
  LayoutGrid,
  List,
  Mic,
  Minus,
  Music,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Users,
  Wine,
  X,
} from 'lucide-react';

const uid = () => Math.random().toString(36).slice(2, 10);

const SHAPE_LABELS = {
  round: 'Round',
  rectangle: 'Estate',
  square: 'Square',
  oval: 'Oval',
  'u-shape': 'U-Shape',
  'head-table': 'Head Table',
  cocktail: 'Cocktail',
  custom: 'Custom',
};

/**
 * Touch-first mobile seating manager with no drag-and-drop dependencies.
 * Table and zone coordinates are always read-only on mobile.
 */
export default function MobileSeatingView() {
  const { activeWedding, canEdit } = useWedding();
  const toast = useToast();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [tables, setTables] = useState([]);
  const [rules, setRules] = useState([]);
  const [zones, setZones] = useState([]);
  const [venueImage, setVenueImage] = useState(null);
  const [venueOpacity, setVenueOpacity] = useState(0.3);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [mobileZoom, setMobileZoom] = useState(0.35);
  const [viewMode, setViewMode] = useState('layout');
  const [guestSearch, setGuestSearch] = useState('');
  const [showAddTable, setShowAddTable] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showEditTable, setShowEditTable] = useState(false);
  const [editTable, setEditTable] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, (evts) => {
      setEvents(evts);
      setSelectedEventId((current) => current || evts[0]?.id || null);
    });
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  useEffect(() => {
    if (!activeWedding || !selectedEventId) return;
    return subscribeToSeating(activeWedding.id, selectedEventId, (data) => {
      setTables(data.tables || []);
      setRules(data.rules || []);
      setZones(data.zones || []);
      setVenueImage(data.venueImage || null);
      setVenueOpacity(data.venueOpacity !== undefined ? data.venueOpacity : 0.3);
      setHasChanges(false);
    });
  }, [activeWedding, selectedEventId]);

  const assignedGuestIds = useMemo(() => {
    const ids = new Set();
    tables.forEach((t) => (t.assignedGuests || []).forEach((id) => ids.add(id)));
    return ids;
  }, [tables]);

  const unassignedGuests = useMemo(
    () => guests.filter((g) => !assignedGuestIds.has(g.id)),
    [guests, assignedGuestIds],
  );

  const ruleEvaluation = useMemo(
    () => evaluateSeatingRules(rules, tables, guests),
    [rules, tables, guests],
  );

  const canvasBounds = useMemo(
    () => getMobileLayoutBounds(tables, zones),
    [tables, zones],
  );

  const selectedTable = useMemo(
    () => tables.find((table) => table.id === selectedTableId) || null,
    [tables, selectedTableId],
  );

  const tableByGuestId = useMemo(() => {
    const result = {};
    tables.forEach((table) => {
      (table.assignedGuests || []).forEach((guestId) => {
        result[guestId] = table;
      });
    });
    return result;
  }, [tables]);

  const filteredGuests = useMemo(() => {
    const query = guestSearch.trim().toLowerCase();
    if (!query) return guests;
    return guests.filter((guest) =>
      `${guest.firstName || ''} ${guest.lastName || ''} ${guest.familyName || ''}`
        .toLowerCase()
        .includes(query),
    );
  }, [guestSearch, guests]);

  const fitLayout = useCallback(() => {
    const availableWidth = (typeof window !== 'undefined' ? window.innerWidth : 380) - 24;
    setMobileZoom(Math.max(0.15, Math.min(0.75, availableWidth / canvasBounds.width)));
  }, [canvasBounds.width]);

  // Auto-zoom so the whole layout fits the phone width on first load / event
  // change (mirrors the desktop fit-to-view behaviour).
  useEffect(() => {
    if (tables.length === 0 && zones.length === 0) return;
    fitLayout();
  }, [selectedEventId, tables.length, zones.length, fitLayout]);

  const handleSave = useCallback(async () => {
    if (!activeWedding || !selectedEventId || !canEdit) return;
    setSaveState('saving');
    try {
      await saveSeating(activeWedding.id, selectedEventId, {
        tables,
        rules,
        zones,
        venueImage: venueImage || null,
        venueOpacity,
      });
      setHasChanges(false);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1600);
    } catch (error) {
      setSaveState('idle');
      toast.error(`Could not save seating: ${error.message}`);
    }
  }, [activeWedding, canEdit, rules, selectedEventId, tables, toast, venueImage, venueOpacity, zones]);

  useEffect(() => {
    if (!hasChanges || !canEdit) return undefined;
    const timer = setTimeout(handleSave, 900);
    return () => clearTimeout(timer);
  }, [canEdit, handleSave, hasChanges]);

  const updateTables = useCallback((updater) => {
    setTables(updater);
    setHasChanges(true);
  }, []);

  const moveGuest = useCallback((guestId, targetTableId) => {
    if (!canEdit) return;
    if (targetTableId) {
      const target = tables.find((table) => table.id === targetTableId);
      if (!target || isIndividualSeat(target)) {
        toast.error('Choose a guest table, not an individual seat');
        return;
      }
      const isAlreadyThere = (target.assignedGuests || []).includes(guestId);
      if (!isAlreadyThere && (target.assignedGuests || []).length >= target.capacity + 2) {
        toast.error(`${target.name} is already two seats over capacity`);
        return;
      }
    }
    updateTables((current) => assignGuestWithoutDragging(current, guestId, targetTableId));
  }, [canEdit, tables, toast, updateTables]);

  const handleAutoSeat = useCallback(() => {
    if (!canEdit || unassignedGuests.length === 0 || tables.length === 0) return;
    const seatableTables = tables.filter((table) => !isIndividualSeat(table));
    const { assignments, overflow } = autoSuggestSeating(unassignedGuests, seatableTables, rules);
    updateTables((current) => current.map((table) => {
      const additions = assignments.get(table.id) || [];
      return additions.length > 0
        ? { ...table, assignedGuests: [...(table.assignedGuests || []), ...additions] }
        : table;
    }));
    const seatedCount = [...assignments.values()].reduce((total, ids) => total + ids.length, 0);
    if (overflow.length > 0) {
      toast.warning(`Seated ${seatedCount} guests. ${overflow.length} still need seats.`);
    } else {
      toast.success(`Seated ${seatedCount} guests`);
    }
  }, [canEdit, rules, tables, toast, unassignedGuests, updateTables]);

  const addTable = useCallback((preset) => {
    if (!canEdit) return;
    const position = getNextLockedTablePosition(tables, zones);
    const nextTable = {
      id: uid(),
      name: `Table ${tables.length + 1}`,
      shape: preset.shape,
      capacity: preset.capacity,
      width: preset.width,
      height: preset.height,
      ...position,
      assignedGuests: [],
    };
    updateTables((current) => [...current, nextTable]);
    setShowAddTable(false);
    setSelectedTableId(nextTable.id);
    setViewMode('layout');
  }, [canEdit, tables, updateTables, zones]);

  const replaceLayout = useCallback((newTables, newZones) => {
    setTables(newTables.map((t) => ({ ...t, id: uid(), assignedGuests: [] })));
    setZones((newZones || []).map((z) => ({ ...z, id: uid() })));
    setHasChanges(true);
    setShowPresets(false);
    setSelectedTableId(null);
    setViewMode('layout');
  }, []);

  const confirmReplace = useCallback(() => {
    if (tables.length === 0 && zones.length === 0) return true;
    return window.confirm('Replace the current layout with this preset? Assigned guests will be cleared.');
  }, [tables.length, zones.length]);

  const applyPreset = useCallback((layout) => {
    if (!canEdit || !confirmReplace()) return;
    replaceLayout(layout.tables, layout.zones);
    toast.success(`Applied ${layout.name} layout`);
  }, [canEdit, confirmReplace, replaceLayout, toast]);

  const applyLayoutGenerator = useCallback((layoutType) => {
    if (!canEdit || !confirmReplace()) return;
    const guestCount = guests.filter((g) => g.rsvpStatus?.[selectedEventId] !== 'declined').length;
    const seatsPerTable = layoutType === 'reception' ? 8 : 10;
    const tableCount = Math.max(6, Math.ceil((guestCount || 80) / seatsPerTable) + 1);
    try {
      let generated;
      switch (layoutType) {
        case 'indianWedding': generated = generateIndianWeddingLayout(tableCount); break;
        case 'mehendi': generated = generateMehendiLayout(tableCount); break;
        case 'reception': generated = generateReceptionLayout(tableCount); break;
        default: return;
      }
      replaceLayout(generated.tables, generated.zones);
      toast.success(`Applied ${layoutType} layout for ${guestCount} guests`);
    } catch (err) {
      toast.error('Failed to apply layout: ' + err.message);
    }
  }, [canEdit, confirmReplace, guests, replaceLayout, selectedEventId, toast]);

  const openEditTable = useCallback(() => {
    if (!selectedTable || !canEdit) return;
    setEditTable({
      name: selectedTable.name,
      capacity: selectedTable.capacity,
    });
    setShowEditTable(true);
  }, [canEdit, selectedTable]);

  const saveTableEdits = useCallback(() => {
    if (!selectedTable || !editTable) return;
    updateTables((current) => current.map((table) => (
      table.id === selectedTable.id
        ? {
            ...table,
            name: editTable.name.trim() || table.name,
            capacity: Math.max(1, Number(editTable.capacity) || table.capacity),
          }
        : table
    )));
    setShowEditTable(false);
  }, [editTable, selectedTable, updateTables]);

  const removeSelectedTable = useCallback(() => {
    if (!selectedTable || !canEdit) return;
    if (!window.confirm(`Remove ${selectedTable.name}? Its guests will become unassigned.`)) return;
    updateTables((current) => current.filter((table) => table.id !== selectedTable.id));
    setSelectedTableId(null);
  }, [canEdit, selectedTable, updateTables]);

  if (!activeWedding) return null;

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] flex-col overflow-hidden -mx-4 -my-5 bg-ivory-50">
      {/* Header */}
      <div className="shrink-0 border-b border-gray-200 bg-white px-3 pb-3 pt-2">
        <div className="flex items-center justify-between gap-2">
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="min-w-0 max-w-[55%] rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base font-medium text-gray-800 focus:border-wine-500 focus:outline-none focus:ring-2 focus:ring-wine-200 sm:text-sm"
            aria-label="Select event"
          >
            {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
          </select>
          <div className="flex items-center gap-2 text-xs font-medium">
            {saveState === 'saving' && <span className="text-gray-500">Saving</span>}
            {saveState === 'saved' && <span className="inline-flex items-center gap-1 text-green-700"><Check size={13} /> Saved</span>}
            {hasChanges && saveState === 'idle' && <span className="text-amber-700">Unsaved</span>}
            {canEdit && (
              <button
                onClick={handleSave}
                disabled={!hasChanges || saveState === 'saving'}
                className="flex size-11 items-center justify-center rounded-xl bg-wine-700 text-white disabled:bg-gray-200 disabled:text-gray-400"
                aria-label="Save seating chart"
              >
                <Save size={17} />
              </button>
            )}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <SummaryStat value={tables.length} label="tables" />
          <SummaryStat value={`${assignedGuestIds.size}/${guests.length}`} label="seated" />
          <SummaryStat value={unassignedGuests.length} label="unassigned" highlight={unassignedGuests.length > 0} />
        </div>
      </div>

      {viewMode === 'layout' && (
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 bg-white px-3 py-2">
          <button onClick={() => setMobileZoom((zoom) => Math.max(0.15, zoom - 0.05))} className="flex size-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700" aria-label="Zoom out">
            <Minus size={18} />
          </button>
          <span className="w-12 text-center text-xs font-semibold tabular-nums text-gray-500">{Math.round(mobileZoom * 100)}%</span>
          <button onClick={() => setMobileZoom((zoom) => Math.min(0.9, zoom + 0.05))} className="flex size-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700" aria-label="Zoom in">
            <Plus size={18} />
          </button>
          <button onClick={fitLayout} className="h-11 rounded-xl bg-gray-100 px-4 text-xs font-semibold text-gray-700">Fit layout</button>
          <span className="ml-auto text-right text-[11px] leading-tight text-gray-400">Tap a table<br />Positions locked</span>
        </div>
      )}

      {/* Layout */}
      {viewMode === 'layout' && <div className="venue-canvas seating-scroll relative flex-1 overflow-auto">
        {tables.length === 0 && zones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <LayoutGrid size={36} className="mb-3 text-wine-300" />
            <p className="text-sm font-semibold text-gray-700">No layout yet</p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-gray-500">Start from a full venue layout, or add tables one at a time. Mobile places them automatically and keeps every position locked.</p>
            {canEdit && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button onClick={() => setShowPresets(true)}><Sparkles size={16} /> Choose a layout</Button>
                <Button variant="secondary" onClick={() => setShowAddTable(true)}><Plus size={16} /> Add table</Button>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              width: canvasBounds.width * mobileZoom,
              height: canvasBounds.height * mobileZoom,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: canvasBounds.width,
                height: canvasBounds.height,
                position: 'absolute',
                inset: 0,
                transform: `scale(${mobileZoom})`,
                transformOrigin: 'top left',
              }}
            >
            {venueImage && (
              <img
                src={venueImage}
                alt="Venue layout"
                draggable={false}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  opacity: venueOpacity,
                  pointerEvents: 'none',
                  userSelect: 'none',
                }}
              />
            )}
            {/* Render zones (dance floor, stage, bar, etc.) */}
            {zones.map((zone) => {
              const zoneIcons = {
                'dance-floor': Music,
                'dancefloor': Music,
                stage: Mic,
                dj: Mic,
                bar: Wine,
                gifts: Gift,
                cake: Cake,
                desserts: Cake,
                photo: Camera,
                entrance: DoorOpen,
                custom: CircleDot,
              };
              const Icon = zoneIcons[zone.type] || Music;
              const isDanceFloor = zone.type === 'dance-floor' || zone.type === 'dancefloor';
              const zoneStyles = {
                'dance-floor': 'border-purple-300 bg-purple-50/80 shadow-inner',
                'dancefloor': 'border-purple-300 bg-purple-50/80 shadow-inner',
                stage: 'border-amber-300 bg-amber-50/80',
                dj: 'border-indigo-300 bg-indigo-50/80',
                bar: 'border-blue-300 bg-blue-50/80',
                'cocktail-area': 'border-teal-300 bg-teal-50/80',
                gifts: 'border-pink-300 bg-pink-50/80',
                cake: 'border-orange-200 bg-orange-50/80',
                desserts: 'border-yellow-300 bg-yellow-50/80',
                photo: 'border-violet-300 bg-violet-50/80',
                entrance: 'border-slate-300 bg-slate-50/80',
                custom: 'border-gray-300 bg-gray-50/80',
              };
              return (
                <div
                  key={zone.id}
                  style={{
                    position: 'absolute',
                    left: zone.x,
                    top: zone.y,
                    width: zone.width,
                    height: zone.height,
                    borderRadius: isDanceFloor ? '50%' : '12px',
                  }}
                  className={`border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                    zoneStyles[zone.type] || 'border-gray-300 bg-gray-50/80'
                  }`}
                >
                  <Icon size={20} className="text-gray-600 opacity-70" />
                  <span className="text-[9px] font-semibold text-gray-600 opacity-80 leading-tight text-center px-1">
                    {zone.label}
                  </span>
                </div>
              );
            })}

            {/* Render tables */}
            {tables.map((table) => {
              const isSelected = selectedTableId === table.id;
              const assigned = (table.assignedGuests || []).length;
              const isFull = assigned >= table.capacity;
              const isOver = assigned > table.capacity;
              const warningCount = (ruleEvaluation.tableWarnings[table.id] || []).length;
              const shapeClass = table.shape === 'round' || table.shape === 'oval' || table.shape === 'cocktail'
                ? 'rounded-full' : 'rounded-xl';
              return (
                <div
                  key={table.id}
                  onClick={() => setSelectedTableId(isSelected ? null : table.id)}
                  style={{
                    position: 'absolute',
                    left: table.x,
                    top: table.y,
                    width: (table.width || 120) + 80,
                    height: (table.height || 120) + 60,
                    cursor: 'pointer',
                    zIndex: isSelected ? 10 : 1,
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedTableId(isSelected ? null : table.id);
                    }
                  }}
                  aria-label={`View ${table.name}, ${assigned} of ${table.capacity} seats filled`}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 40, top: 30,
                      width: table.width || 120,
                      height: table.height || 120,
                      transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
                    }}
                    className={`border-2 flex flex-col items-center justify-center ${shapeClass} transition-all duration-200 ${
                      isSelected ? 'ring-4 ring-wine-400/40 scale-105' :
                      isOver ? 'border-red-400 bg-red-50 shadow-sm' :
                      warningCount > 0 ? 'border-amber-400 bg-amber-50 shadow-sm' :
                      isFull ? 'border-green-300 bg-green-50 shadow-sm' :
                      'border-gray-300 bg-white shadow-sm'
                    }`}
                  >
                    {warningCount > 0 && <AlertTriangle size={13} className="absolute right-3 top-3 text-amber-600" />}
                    <span className="text-xs font-semibold text-gray-700 leading-tight">{table.name}</span>
                    <span className={`text-[10px] font-bold mt-0.5 ${isOver ? 'text-red-600' : isFull ? 'text-green-600' : 'text-gray-500'}`}>
                      {assigned}/{table.capacity}
                    </span>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>}

      {/* Table list */}
      {viewMode === 'tables' && (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Tables</h2>
              <p className="text-xs text-gray-500">Tap a table to manage its guests.</p>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setShowPresets(true)}><Sparkles size={15} /> Layouts</Button>
                <Button size="sm" onClick={() => setShowAddTable(true)}><Plus size={15} /> Add</Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {tables.map((table) => {
              const assigned = (table.assignedGuests || []).length;
              const warnings = (ruleEvaluation.tableWarnings[table.id] || []).length;
              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTableId(table.id)}
                  className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-gray-100 active:scale-[0.99]"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl bg-wine-50 font-semibold text-wine-700">{assigned}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">{table.name}</span>
                      {warnings > 0 && <AlertTriangle size={14} className="shrink-0 text-amber-600" />}
                    </div>
                    <p className="text-xs text-gray-500">{assigned}/{table.capacity} seats · {SHAPE_LABELS[table.shape] || table.shape}</p>
                  </div>
                  <span className="text-lg text-gray-300">›</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Guest assignment list */}
      {viewMode === 'guests' && (
        <div className="flex min-h-0 flex-1 flex-col bg-ivory-50">
          <div className="shrink-0 border-b border-gray-200 bg-white p-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={guestSearch}
                onChange={(event) => setGuestSearch(event.target.value)}
                placeholder="Search guests or families"
                className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 text-base focus:border-wine-500 focus:outline-none focus:ring-2 focus:ring-wine-200 sm:text-sm"
              />
            </div>
            {canEdit && unassignedGuests.length > 0 && tables.length > 0 && (
              <button onClick={handleAutoSeat} className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-wine-50 text-sm font-semibold text-wine-700">
                <Sparkles size={16} /> Auto-seat {unassignedGuests.length} unassigned guests
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2">
            {filteredGuests.map((guest) => {
              const assignedTable = tableByGuestId[guest.id];
              return (
                <div key={guest.id} className="mb-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
                  <div className="mb-2 min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{guest.firstName} {guest.lastName}</p>
                    <p className="truncate text-xs text-gray-500">{guest.familyName || 'No family group'}</p>
                  </div>
                  <select
                    value={assignedTable?.id || ''}
                    onChange={(event) => moveGuest(guest.id, event.target.value || null)}
                    disabled={!canEdit}
                    className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base text-gray-700 disabled:bg-gray-50 disabled:text-gray-500 sm:text-sm"
                    aria-label={`Table assignment for ${guest.firstName} ${guest.lastName}`}
                  >
                    <option value="">Unassigned</option>
                    {tables.filter((table) => !isIndividualSeat(table)).map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name} ({(table.assignedGuests || []).length}/{table.capacity})
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table detail bottom sheet */}
      {selectedTable && (
        <div className="sheet-reveal max-h-[48dvh] shrink-0 overflow-auto border-t border-gray-200 bg-white shadow-[0_-8px_24px_rgba(70,40,50,0.10)]">
          <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{selectedTable.name}</h3>
              <p className="text-xs text-gray-500">
                {(selectedTable.assignedGuests || []).length}/{selectedTable.capacity} seats filled
                {selectedTable.shape && ` · ${SHAPE_LABELS[selectedTable.shape] || selectedTable.shape}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {canEdit && <button onClick={openEditTable} className="flex size-11 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100" aria-label={`Edit ${selectedTable.name}`}><Edit3 size={17} /></button>}
              <button onClick={() => setSelectedTableId(null)} aria-label="Close table details" className="flex size-11 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100"><X size={20} /></button>
            </div>
          </div>
          <div className="px-4 py-3">
            {(ruleEvaluation.tableWarnings[selectedTable.id] || []).length > 0 && (
              <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                {(ruleEvaluation.tableWarnings[selectedTable.id] || []).map((warning, index) => (
                  <p key={warning.id || index} className="flex gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{warning.message || String(warning)}</p>
                ))}
              </div>
            )}
            {(selectedTable.assignedGuests || []).length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No guests assigned yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {(selectedTable.assignedGuests || []).map((gId) => {
                  const g = guests.find((gu) => gu.id === gId);
                  if (!g) return null;
                  return (
                    <li key={gId} className="flex items-center gap-2 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{g.firstName} {g.lastName}</p>
                        {g.familyName && <p className="text-xs text-gray-500">{g.familyName}</p>}
                      </div>
                      {canEdit && (
                        <select
                          value={selectedTable.id}
                          onChange={(event) => moveGuest(g.id, event.target.value || null)}
                          className="h-11 max-w-[10rem] rounded-xl border border-gray-300 bg-white px-2 text-base sm:text-sm"
                          aria-label={`Move ${g.firstName} ${g.lastName}`}
                        >
                          <option value="">Unassign</option>
                          {tables.filter((table) => !isIndividualSeat(table)).map((table) => (
                            <option key={table.id} value={table.id}>{table.name}</option>
                          ))}
                        </select>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {canEdit && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <label htmlFor="mobile-table-add-guest" className="mb-1 block text-xs font-semibold text-gray-600">Add an unassigned guest</label>
                <select
                  id="mobile-table-add-guest"
                  value=""
                  onChange={(event) => {
                    if (event.target.value) moveGuest(event.target.value, selectedTable.id);
                  }}
                  className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-base sm:text-sm"
                >
                  <option value="">Choose guest</option>
                  {unassignedGuests.map((guest) => (
                    <option key={guest.id} value={guest.id}>{guest.firstName} {guest.lastName}</option>
                  ))}
                </select>
                <button onClick={removeSelectedTable} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50">
                  <Trash2 size={16} /> Remove table
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile navigation */}
      <div className="grid shrink-0 grid-cols-3 border-t border-gray-200 bg-white px-2 pb-[env(safe-area-inset-bottom)]">
        <MobileNavButton active={viewMode === 'layout'} icon={LayoutGrid} label="Layout" onClick={() => setViewMode('layout')} />
        <MobileNavButton active={viewMode === 'tables'} icon={List} label="Tables" onClick={() => setViewMode('tables')} />
        <MobileNavButton active={viewMode === 'guests'} icon={Users} label="Guests" badge={unassignedGuests.length} onClick={() => setViewMode('guests')} />
      </div>

      <Modal open={showAddTable} onClose={() => setShowAddTable(false)} title="Add a table" size="md">
        <p className="mb-3 text-sm text-gray-600">Choose a table type. It will be placed below the current layout and remain locked on mobile.</p>
        <div className="grid grid-cols-2 gap-2">
          {TABLE_PRESETS.map((preset) => (
            <button key={`${preset.shape}-${preset.label}`} onClick={() => addTable(preset)} className="rounded-2xl border border-gray-200 p-3 text-left transition-colors hover:border-wine-200 hover:bg-wine-50">
              <p className="text-sm font-semibold text-gray-900">{preset.label}</p>
              <p className="mt-1 text-xs text-gray-500">{preset.capacity} seats</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={showPresets} onClose={() => setShowPresets(false)} title="Layout presets" size="lg">
        <p className="mb-3 text-sm text-gray-600">Pick a full venue layout. It replaces the current tables and zones for this event — positions stay locked on mobile, and you can still add or edit tables afterward.</p>

        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Auto-fit to your guest count</div>
        <div className="mb-5 grid grid-cols-1 gap-2">
          {[
            { type: 'indianWedding', label: 'Indian Wedding', desc: 'Rounds around a central stage & dance floor' },
            { type: 'reception', label: 'Reception', desc: 'Head table with rounds and a dance floor' },
            { type: 'mehendi', label: 'Mehendi / Sangeet', desc: 'Relaxed lounge-style seating' },
          ].map((gen) => (
            <button
              key={gen.type}
              onClick={() => applyLayoutGenerator(gen.type)}
              className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3 text-left transition-colors hover:border-wine-200 hover:bg-wine-50"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-wine-50 text-wine-700"><Sparkles size={18} /></span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">{gen.label}</span>
                <span className="block text-xs text-gray-500">{gen.desc}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Fixed venue presets</div>
        <div className="grid grid-cols-1 gap-2">
          {VENUE_LAYOUTS.map((layout) => {
            const Icon = layout.icon || LayoutGrid;
            return (
              <button
                key={layout.name}
                onClick={() => applyPreset(layout)}
                className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3 text-left transition-colors hover:border-wine-200 hover:bg-wine-50"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ivory-100 text-wine-700"><Icon size={18} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900">{layout.name}</span>
                  {layout.description && <span className="block text-xs text-gray-500">{layout.description}</span>}
                </span>
                <span className="shrink-0 text-right text-[11px] font-medium text-gray-400">
                  {layout.tables?.length || 0} tables
                </span>
              </button>
            );
          })}
        </div>
      </Modal>

      <Modal open={showEditTable} onClose={() => setShowEditTable(false)} title="Edit table" size="sm">
        {editTable && (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Table name</span>
              <input value={editTable.name} onChange={(event) => setEditTable((current) => ({ ...current, name: event.target.value }))} className="h-11 w-full rounded-xl border border-gray-300 px-3 text-base sm:text-sm" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Capacity</span>
              <input type="number" min="1" max="50" value={editTable.capacity} onChange={(event) => setEditTable((current) => ({ ...current, capacity: event.target.value }))} className="h-11 w-full rounded-xl border border-gray-300 px-3 text-base sm:text-sm" />
            </label>
            <Button className="w-full" onClick={saveTableEdits}>Save table</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

function SummaryStat({ value, label, highlight = false }) {
  return (
    <div className={`rounded-xl px-2 py-2 ${highlight ? 'bg-amber-50' : 'bg-gray-50'}`}>
      <div className={`text-sm font-bold tabular-nums ${highlight ? 'text-amber-800' : 'text-gray-900'}`}>{value}</div>
      <div className={`text-[10px] font-medium ${highlight ? 'text-amber-700' : 'text-gray-500'}`}>{label}</div>
    </div>
  );
}

function MobileNavButton({ active, icon: Icon, label, badge, onClick }) {
  return (
    <button onClick={onClick} className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors ${active ? 'text-wine-700' : 'text-gray-500'}`}>
      <Icon size={19} />
      <span>{label}</span>
      {badge > 0 && <span className="absolute right-[24%] top-1.5 min-w-5 rounded-full bg-amber-100 px-1 text-center text-[10px] leading-5 text-amber-800">{badge}</span>}
    </button>
  );
}
