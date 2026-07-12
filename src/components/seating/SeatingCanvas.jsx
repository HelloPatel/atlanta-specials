import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DndContext, DragOverlay, KeyboardSensor, useSensor, useSensors, PointerSensor, pointerWithin } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { QRCodeSVG } from 'qrcode.react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests, addGuest } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { publishSeating, subscribeToSeating, saveSeating } from '../../services/seatingService';
import { Button, Modal } from '../ui';
import { useToast } from '../ui/Toast';
import { Plus, ZoomIn, ZoomOut, RotateCcw, Save, Upload, Image, FileSpreadsheet, QrCode, AlertTriangle, Copy, Check, ShieldAlert, Grid3X3, Circle, Square, Minus, Wand2, Download, Music, Mic, Wine, Gift, Cake, Camera, DoorOpen, CircleDot } from 'lucide-react';
import { TABLE_DEFAULTS, TABLE_PRESETS } from '../../config/constants';
import TableComponent from './Table';
import GuestSidebar from './GuestSidebar';
import RulesPanel from './RulesPanel';
import { evaluateSeatingRules } from './seatingRules';
import { autoSuggestSeating } from './seatingAutoSuggest';
import { generateIndianWeddingLayout, generateMehendiLayout, generateReceptionLayout, generateStaggeredLayout } from './seatingLayouts';
import { loadFloorPlan, FLOOR_PLAN_ACCEPT } from './floorPlanImport';
import { itemBox, resolveNoOverlap } from './seatingCollision';
import { isIndividualSeat } from './seatingSeat';
import TableDetailModal from './TableDetailModal';
import {
  createQuickTableConfigs,
  parseSeatingText,
  parseSpreadsheetRows,
} from './seatingLayoutImport';

const uid = () => Math.random().toString(36).slice(2, 10);

// Detect mobile once at module level to avoid SSR issues
const IS_MOBILE = typeof window !== 'undefined' && window.innerWidth < 768;

// ─── Zone presets (declared above the component so it is fully initialized
// before render — avoids a production-minifier TDZ crash) ───────────────────
const ZONE_PRESETS = [
  { type: 'dancefloor', label: 'Dance Floor', icon: Music, width: 250, height: 250, color: '#fef3c7' },
  { type: 'dj',         label: 'DJ Booth',    icon: Mic, width: 100, height: 60,  color: '#e0e7ff' },
  { type: 'bar',        label: 'Bar',         icon: Wine,  width: 160, height: 60,  color: '#dbeafe' },
  { type: 'gifts',      label: 'Gifts & Cards', icon: Gift, width: 100, height: 80, color: '#fce7f3' },
  { type: 'desserts',   label: 'Desserts',    icon: Cake,  width: 120, height: 60,  color: '#fef9c3' },
  { type: 'cake',       label: 'Cake',        icon: Cake,  width: 80,  height: 80,  color: '#fff7ed' },
  { type: 'stage',      label: 'Stage / Mandap', icon: Mic, width: 300, height: 150, color: '#fee2e2' },
  { type: 'photo',      label: 'Photo Booth', icon: Camera, width: 100, height: 80,  color: '#f3e8ff' },
  { type: 'entrance',   label: 'Entrance',    icon: DoorOpen,  width: 80,  height: 40,  color: '#f1f5f9' },
  { type: 'custom',     label: 'Custom Zone',  icon: CircleDot,  width: 150, height: 100, color: '#f3f4f6' },
];


export default function SeatingCanvas() {
  const { activeWedding, canEdit } = useWedding();
  const toast = useToast();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [tables, setTables] = useState([]);
  const [rules, setRules] = useState([]);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedGuest, setDraggedGuest] = useState(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [customTable, setCustomTable] = useState({ name: '', shape: 'round', capacity: 10, width: 120, height: 120 });
  const [venueImage, setVenueImage] = useState(null);
  const [venueOpacity, setVenueOpacity] = useState(0.3);
  const [zones, setZones] = useState([]); // non-seatable elements: dance floor, DJ, bar, etc.
  const [filterSide, setFilterSide] = useState('all');
  const [filterFamily, setFilterFamily] = useState('all');
  const [hasChanges, setHasChanges] = useState(false);
  const [saveState, setSaveState] = useState('idle'); // idle | saving | saved
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copiedFinderLink, setCopiedFinderLink] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [detailTableId, setDetailTableId] = useState(null);
  const canvasScrollRef = useRef(null);
  const qrPrintRef = useRef(null);
  const shouldFitRef = useRef(false);
  const fittedEventRef = useRef(null);
  const pendingScrollRef = useRef(null);
  const publishedEventRef = useRef(null);

  // Only initialize DnD sensors on desktop — avoids @dnd-kit issues on iOS Safari
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Subscribe to data
  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, (evts) => {
      setEvents(evts);
      if (!selectedEventId && evts.length > 0) setSelectedEventId(evts[0].id);
    });
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  // Subscribe to seating for selected event
  useEffect(() => {
    if (!activeWedding || !selectedEventId) return;
    return subscribeToSeating(activeWedding.id, selectedEventId, (data) => {
      setTables(data.tables || []);
      setRules(data.rules || []);
      setZones(data.zones || []);
      setVenueImage(data.venueImage || null);
      setVenueOpacity(data.venueOpacity !== undefined ? data.venueOpacity : 0.3);
      if (canEdit && publishedEventRef.current !== selectedEventId) {
        publishedEventRef.current = selectedEventId;
        publishSeating(activeWedding.id, selectedEventId, data).catch((error) => {
          publishedEventRef.current = null;
          console.error('Failed to publish minimized seating data:', error);
        });
      }
    });
  }, [activeWedding, canEdit, selectedEventId]);

  // Compute assigned/unassigned guests
  const assignedGuestIds = useMemo(() => {
    const ids = new Set();
    tables.forEach((t) => (t.assignedGuests || []).forEach((id) => ids.add(id)));
    return ids;
  }, [tables]);

  const unassignedGuests = useMemo(() => {
    return guests.filter((g) => {
      if (assignedGuestIds.has(g.id)) return false;
      if (filterSide !== 'all' && g.side !== filterSide) return false;
      if (filterFamily !== 'all' && g.familyName !== filterFamily) return false;
      return true;
    });
  }, [guests, assignedGuestIds, filterSide, filterFamily]);

  const families = useMemo(() => {
    return [...new Set(guests.map((g) => g.familyName).filter(Boolean))].sort();
  }, [guests]);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId],
  );

  const finderLink = useMemo(() => {
    if (typeof window === 'undefined' || !activeWedding?.id || !selectedEventId) return '';
    const identifier = activeWedding.slug || activeWedding.id;
    return `${window.location.origin}/find-table/${identifier}/${selectedEventId}`;
  }, [activeWedding, selectedEventId]);

  const ruleEvaluation = useMemo(
    () => evaluateSeatingRules(rules, tables, guests),
    [rules, tables, guests],
  );

  // Save to Firestore
  const handleSave = useCallback(async () => {
    if (!activeWedding || !selectedEventId) return;
    setSaveState('saving');
    try {
      await saveSeating(activeWedding.id, selectedEventId, { tables, rules, zones, venueImage: venueImage || null, venueOpacity });
      setHasChanges(false);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch (err) {
      setSaveState('idle');
      toast.error('Failed to save: ' + err.message);
    }
  }, [activeWedding, selectedEventId, tables, rules, zones, venueImage, venueOpacity, toast]);

  const handleRulesChange = useCallback((nextRules) => {
    setRules(nextRules);
    setHasChanges(true);
  }, []);

  const handleCopyFinderLink = useCallback(async () => {
    if (!finderLink) return;
    try {
      await navigator.clipboard?.writeText(finderLink);
      setCopiedFinderLink(true);
      setTimeout(() => setCopiedFinderLink(false), 2000);
    } catch {
      // Clipboard API unavailable — ignore.
    }
  }, [finderLink]);

  const handlePrintQr = useCallback(() => {
    if (!finderLink || !qrPrintRef.current) return;

    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Table Finder QR</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; text-align: center; color: #111827; }
            .wrapper { max-width: 520px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 24px; padding: 32px; }
            .subtitle { color: #e11d48; font-size: 12px; letter-spacing: 0.25em; text-transform: uppercase; }
            .title { font-size: 28px; font-weight: 700; margin: 12px 0 8px; }
            .text { color: #6b7280; margin-bottom: 24px; }
            .url { font-size: 14px; word-break: break-all; margin-top: 20px; color: #374151; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="subtitle">${selectedEvent?.name || 'Table Finder'}</div>
            <div class="title">Find Your Table</div>
            <div class="text">Scan this QR code or visit the link below to see your table assignment.</div>
            ${qrPrintRef.current.innerHTML}
            <div class="url">${finderLink}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [finderLink, selectedEvent]);

  const handleExportSeating = useCallback(async () => {
    const XLSX = await import('xlsx');
    const rows = [];
    tables.forEach((table) => {
      (table.assignedGuests || []).forEach((gId) => {
        const g = guests.find((gu) => gu.id === gId);
        if (!g) return;
        rows.push({
          'Table': table.name,
          'First Name': g.firstName,
          'Last Name': g.lastName,
          'Family': g.familyName || g.family || '',
          'Side': g.side || '',
          'Dietary': g.dietaryPreference || '',
          'RSVP': g.rsvpStatus?.[selectedEventId] || 'pending',
        });
      });
    });
    // Add unassigned guests
    unassignedGuests.forEach((g) => {
      rows.push({
        'Table': '(Unassigned)',
        'First Name': g.firstName,
        'Last Name': g.lastName,
        'Family': g.familyName || g.family || '',
        'Side': g.side || '',
        'Dietary': g.dietaryPreference || '',
        'RSVP': g.rsvpStatus?.[selectedEventId] || 'pending',
      });
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Seating');
    XLSX.writeFile(wb, `seating-${selectedEvent?.name || 'chart'}.xlsx`);
    toast.success('Seating chart exported');
  }, [tables, guests, unassignedGuests, selectedEventId, selectedEvent, toast]);

  const handleDownloadPdf = useCallback(async () => {
    if (tables.length === 0) return;
    setIsDownloadingPdf(true);
    try {
      const { generateSeatingChartPDF } = await import('../print/pdfGenerators');
      const doc = generateSeatingChartPDF(tables, zones, guests, {
        eventName: selectedEvent?.name || '',
        weddingName: activeWedding?.name || activeWedding?.coupleNames || '',
        showDietary: true,
      });
      const safeEventName = (selectedEvent?.name || 'seating-chart')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      doc.save(`${safeEventName || 'seating-chart'}-seating.pdf`);
      toast.success('Seating PDF downloaded');
    } catch (error) {
      console.error('Seating PDF generation failed:', error);
      toast.error(`Could not create the seating PDF: ${error.message}`);
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [activeWedding, guests, selectedEvent, tables, toast, zones]);

  const handleFocusTable = useCallback((tableId) => {
    const table = tables.find((item) => item.id === tableId);
    if (!table || !canvasScrollRef.current) return;

    canvasScrollRef.current.scrollTo({
      left: Math.max(table.x * zoom - canvasScrollRef.current.clientWidth / 3, 0),
      top: Math.max(table.y * zoom - canvasScrollRef.current.clientHeight / 3, 0),
      behavior: 'smooth',
    });
    setShowRules(false);
  }, [tables, zoom]);

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-19), JSON.stringify(tables)]);
  }, [tables]);

  const handleUndo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setTables(JSON.parse(last));
      setHasChanges(true);
      toast.info('Undone');
      return prev.slice(0, -1);
    });
  }, [toast]);

  const handleAutoSuggest = useCallback(() => {
    if (unassignedGuests.length === 0 || tables.length === 0) return;
    const confirmMsg = `Auto-seat ${unassignedGuests.length} unassigned guest${unassignedGuests.length === 1 ? '' : 's'} across available tables?\n\nThis keeps families together and respects your seating rules. You can undo with Ctrl+Z.`;
    if (!window.confirm(confirmMsg)) return;

    pushUndo();
    const seatableTables = tables.filter((t) => !isIndividualSeat(t));
    const { assignments, overflow } = autoSuggestSeating(unassignedGuests, seatableTables, rules);
    const seatedCount = [...assignments.values()].reduce((sum, arr) => sum + arr.length, 0);
    const updatedTables = tables.map((t) => {
      const newGuests = assignments.get(t.id) || [];
      if (newGuests.length === 0) return t;
      return { ...t, assignedGuests: [...(t.assignedGuests || []), ...newGuests] };
    });
    setTables(updatedTables);
    setHasChanges(true);

    if (overflow.length > 0) {
      toast.warning(`Seated ${seatedCount} guests. ${overflow.length} couldn't be placed (not enough capacity).`);
    } else {
      toast.success(`All ${seatedCount} guests auto-seated!`);
    }
  }, [unassignedGuests, tables, rules, pushUndo, toast]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!hasChanges) return;
    const timer = setTimeout(handleSave, 2000);
    return () => clearTimeout(timer);
  }, [hasChanges, handleSave]);

  // Ctrl+S to force save immediately
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (hasChanges) handleSave();
      }
      // Ctrl+Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hasChanges, handleSave, undoStack]);

  // Add table — accepts a preset or custom config
  const addTable = (config) => {
    const defaults = TABLE_DEFAULTS[config.shape] || TABLE_DEFAULTS.round;
    const newTable = {
      id: uid(),
      name: config.name || `Table ${tables.length + 1}`,
      shape: config.shape || 'round',
      capacity: config.capacity || defaults.capacity,
      width: config.width || defaults.width,
      height: config.height || defaults.height,
      x: 100 + Math.random() * 400,
      y: 100 + Math.random() * 300,
      assignedGuests: [],
    };
    setTables((prev) => [...prev, newTable]);
    setHasChanges(true);
    setShowAddTable(false);
  };

  // Bulk add from import — respects explicit coordinates/size when provided,
  // routes zone rows (dance floor, stage, DJ, bar…) into zones, and falls back
  // to a tidy grid for plain table lists.
  const addTablesBatch = (items) => {
    const zoneItems = items.filter((c) => c.__zone);
    const tableItems = items.filter((c) => !c.__zone);

    if (tableItems.length) {
      setTables((prev) => {
        const positioned = tableItems.map((config, i) => {
          const defaults = TABLE_DEFAULTS[config.shape] || TABLE_DEFAULTS.round;
          const idx = prev.length + i;
          return {
            id: uid(),
            name: config.name || `Table ${idx + 1}`,
            shape: config.shape || 'round',
            capacity: config.capacity || defaults?.capacity || 10,
            width: config.width || defaults?.width || 120,
            height: config.height || defaults?.height || 120,
            x: Number.isFinite(config.x) ? config.x : 80 + (idx % 6) * 200,
            y: Number.isFinite(config.y) ? config.y : 80 + Math.floor(idx / 6) * 200,
            assignedGuests: [],
          };
        });
        return [...prev, ...positioned];
      });
    }

    if (zoneItems.length) {
      setZones((prev) => [
        ...prev,
        ...zoneItems.map((z, i) => ({
          id: uid(),
          type: z.type || 'custom',
          label: z.name || z.label || 'Zone',
          x: Number.isFinite(z.x) ? z.x : 500 + i * 40,
          y: Number.isFinite(z.y) ? z.y : 500 + i * 40,
          width: z.width || 200,
          height: z.height || 160,
        })),
      ]);
    }

    setHasChanges(true);
    setShowImport(false);
  };

  // Add zone (non-seatable element)
  const addZone = (zone) => {
    setZones((prev) => [...prev, {
      id: uid(),
      label: zone.label || 'Zone',
      type: zone.type || 'dancefloor', // dancefloor | dj | bar | gifts | stage | dessert | photo | custom
      width: zone.width || 200,
      height: zone.height || 200,
      x: 400 + Math.random() * 200,
      y: 200 + Math.random() * 200,
      color: zone.color || '#f3f4f6',
    }]);
    setHasChanges(true);
  };

  const removeZone = (zoneId) => {
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
    setHasChanges(true);
  };

  const updateZone = (zoneId, updates) => {
    setZones((prev) => prev.map((z) => z.id === zoneId ? { ...z, ...updates } : z));
    setHasChanges(true);
  };

  // Zoom + scroll so the whole layout (tables and zones) is framed in view.
  // The canvas is a fixed 3000x2000 area scaled by `zoom` with origin 0,0, so
  // fitting requires BOTH setting the zoom and scrolling to the content bounds.
  const fitToView = useCallback(() => {
    const el = canvasScrollRef.current;
    if (!el) return;
    const items = [...tables, ...zones];
    if (items.length === 0) return;

    const minX = Math.min(...items.map((i) => i.x || 0));
    const minY = Math.min(...items.map((i) => i.y || 0));
    const maxX = Math.max(...items.map((i) => (i.x || 0) + (i.width || 150)));
    const maxY = Math.max(...items.map((i) => (i.y || 0) + (i.height || 150)));

    const pad = 100;
    const contentW = (maxX - minX) + pad * 2;
    const contentH = (maxY - minY) + pad * 2;
    const z = Math.max(
      0.3,
      Math.min(el.clientWidth / contentW, el.clientHeight / contentH, 1.25),
    );
    const rounded = Math.round(z * 100) / 100;

    // Queue the scroll target so it applies AFTER the new zoom commits (the
    // scrollable extent depends on the scaled child width/height).
    pendingScrollRef.current = {
      x: Math.max(0, (minX - pad) * rounded),
      y: Math.max(0, (minY - pad) * rounded),
    };
    setZoom(rounded);
  }, [tables, zones]);

  // Apply any queued scroll target once the zoom change has committed.
  useEffect(() => {
    const target = pendingScrollRef.current;
    if (!target || !canvasScrollRef.current) return;
    pendingScrollRef.current = null;
    canvasScrollRef.current.scrollLeft = target.x;
    canvasScrollRef.current.scrollTop = target.y;
  }, [zoom]);

  // Auto zoom-to-fit: when a layout is applied, or when seating data first
  // loads for an event, frame the whole layout automatically.
  useEffect(() => {
    if (tables.length === 0 && zones.length === 0) return;
    const isNewEvent = fittedEventRef.current !== selectedEventId;
    if (shouldFitRef.current || isNewEvent) {
      shouldFitRef.current = false;
      fittedEventRef.current = selectedEventId;
      // Defer a frame so the canvas has laid out at its current size.
      requestAnimationFrame(() => fitToView());
    }
  }, [tables, zones, selectedEventId, fitToView]);

  // Apply venue preset layout
  const applyPreset = (preset) => {
    setTables(preset.tables.map((t, i) => ({ ...t, id: uid(), assignedGuests: [] })));
    setZones(preset.zones.map((z) => ({ ...z, id: uid() })));
    setHasChanges(true);
    setShowPresets(false);
    shouldFitRef.current = true;
  };

  // Apply layout generator (Indian wedding, mehendi, reception, staggered)
  const applyLayoutGenerator = (layoutType) => {
    const guestCount = guests.filter(g => g.rsvpStatus?.[selectedEventId] !== 'declined').length;
    // Derive a sensible table count from the guest count (generators expect a
    // table count, not a head count). Reception rounds seat 8; others seat ~10.
    const seatsPerTable = layoutType === 'reception' ? 8 : 10;
    const tableCount = Math.max(6, Math.ceil((guestCount || 80) / seatsPerTable) + 1);
    let newTables, newZones;

    try {
      switch (layoutType) {
        case 'indianWedding':
          ({ tables: newTables, zones: newZones } = generateIndianWeddingLayout(tableCount));
          break;
        case 'mehendi':
          ({ tables: newTables, zones: newZones } = generateMehendiLayout(tableCount));
          break;
        case 'reception':
          ({ tables: newTables, zones: newZones } = generateReceptionLayout(tableCount));
          break;
        case 'staggered':
          ({ tables: newTables, zones: newZones } = generateReceptionLayout(tableCount));
          break;
        default:
          return;
      }

      setTables(newTables.map(t => ({ ...t, id: uid(), assignedGuests: [] })));
      setZones(newZones.map(z => ({ ...z, id: uid() })));
      setHasChanges(true);
      setShowPresets(false);
      shouldFitRef.current = true;
      toast.success(`Applied ${layoutType} layout for ${guestCount} guests`);
    } catch (err) {
      toast.error('Failed to apply layout: ' + err.message);
    }
  };

  // Remove table
  const removeTable = (tableId) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    setHasChanges(true);
  };

  // Update table (position, capacity, name)
  const updateTable = (tableId, updates) => {
    setTables((prev) => prev.map((t) => t.id === tableId ? { ...t, ...updates } : t));
    setHasChanges(true);
  };

  // DnD handlers
  const handleDragStart = (event) => {
    const guestId = event.active.id;
    const guest = guests.find((g) => g.id === guestId);
    setDraggedGuest(guest);
    setIsDragging(true);
  };

  const handleDragEnd = (event) => {
    setIsDragging(false);
    setDraggedGuest(null);

    const { active, over } = event;
    if (!over) return;

    const guestId = active.id;
    const targetTableId = over.id;

    if (targetTableId === 'unassigned-zone') {
      // Remove from table
      pushUndo();
      setTables((prev) => prev.map((t) => ({
        ...t,
        assignedGuests: (t.assignedGuests || []).filter((id) => id !== guestId),
      })));
      setHasChanges(true);
      return;
    }

    // Find target table
    const targetTable = tables.find((t) => t.id === targetTableId);
    if (!targetTable) return;

    // Individual ceremony seats (single chairs) are not assignable — guests can
    // only be placed on multi-seat tables.
    if (isIndividualSeat(targetTable)) {
      toast.error('Assign guests to tables, not individual seats');
      return;
    }

    pushUndo();

    // Check capacity — allow up to capacity + 2 max overflow
    const currentCount = (targetTable.assignedGuests || []).length;
    const alreadySeated = (targetTable.assignedGuests || []).includes(guestId);
    if (!alreadySeated && currentCount >= targetTable.capacity + 2) {
      return; // Hard cap: no more than 2 over capacity
    }

    setTables((prev) => prev.map((t) => {
      // Remove guest from any current table
      const filtered = (t.assignedGuests || []).filter((id) => id !== guestId);
      // Add to target table
      if (t.id === targetTableId) {
        return { ...t, assignedGuests: [...filtered, guestId] };
      }
      return { ...t, assignedGuests: filtered };
    }));
    setHasChanges(true);
  };

  // Table position drag via grip handle — collision-aware (no overlap allowed)
  const handleTableDrag = useCallback((tableId, deltaX, deltaY) => {
    setTables((prev) => {
      const moving = prev.find((t) => t.id === tableId);
      if (!moving) return prev;
      const proposedX = (moving.x || 0) + deltaX / zoom;
      const proposedY = (moving.y || 0) + deltaY / zoom;
      const obstacles = [
        ...prev.filter((t) => t.id !== tableId).map((t) => itemBox(t, 'table')),
        ...zones.map((z) => itemBox(z, 'zone')),
      ];
      const { x, y } = resolveNoOverlap('table', moving.width, moving.height, proposedX, proposedY, obstacles);
      return prev.map((t) => (t.id === tableId ? { ...t, x, y } : t));
    });
    setHasChanges(true);
  }, [zoom, zones]);

  // Zone position drag — absolute positioning + collision-aware (no overlap)
  const handleZoneMove = useCallback((zoneId, absX, absY) => {
    setZones((prev) => {
      const moving = prev.find((z) => z.id === zoneId);
      if (!moving) return prev;
      const obstacles = [
        ...prev.filter((z) => z.id !== zoneId).map((z) => itemBox(z, 'zone')),
        ...tables.map((t) => itemBox(t, 'table')),
      ];
      const { x, y } = resolveNoOverlap('zone', moving.width, moving.height, absX, absY, obstacles);
      return prev.map((z) => (z.id === zoneId ? { ...z, x, y } : z));
    });
    setHasChanges(true);
  }, [tables]);

  // Move a guest from whatever table they're on to a target table (used by the
  // table-detail compare/swap modal). Passing null target unseats the guest.
  const moveGuestToTable = useCallback((guestId, targetTableId) => {
    // Never move a guest onto an individual ceremony seat.
    if (targetTableId) {
      const target = tables.find((t) => t.id === targetTableId);
      if (isIndividualSeat(target)) {
        toast.error('Assign guests to tables, not individual seats');
        return;
      }
    }
    pushUndo();
    setTables((prev) => prev.map((t) => {
      const filtered = (t.assignedGuests || []).filter((id) => id !== guestId);
      if (targetTableId && t.id === targetTableId) {
        return { ...t, assignedGuests: [...filtered, guestId] };
      }
      return { ...t, assignedGuests: filtered };
    }));
    setHasChanges(true);
  }, [pushUndo, tables, toast]);

  if (!activeWedding) return null;


  return (
    <>
      <div className="hidden md:block">
    <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Sidebar — unassigned guests */}
        <GuestSidebar
          guests={unassignedGuests}
          allGuests={guests}
          filterSide={filterSide}
          setFilterSide={setFilterSide}
          filterFamily={filterFamily}
          setFilterFamily={setFilterFamily}
          families={families}
          assignedCount={assignedGuestIds.size}
          totalCount={guests.length}
          onQuickAdd={async ({ firstName, lastName }) => {
            if (!activeWedding) return;
            await addGuest(activeWedding.id, { firstName, lastName });
            toast.success(`Added ${firstName} ${lastName}`);
          }}
        />

        {/* Main canvas */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {/* Toolbar */}
          <div className="no-print relative z-30 flex items-center gap-2 mb-3 flex-wrap overflow-visible toolbar-glass rounded-xl px-3 py-2">
            {/* Event selector */}
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
            </select>

            <div className="flex-1" />

            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(z + 0.1, 2))}>
              <ZoomIn size={14} />
            </Button>
            <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(z - 0.1, 0.3))}>
              <ZoomOut size={14} />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(1)}>
              <RotateCcw size={14} />
            </Button>
            <Button variant="outline" size="sm" onClick={fitToView} title="Fit all tables in view">
              Fit
            </Button>

            <div className="w-px h-6 bg-gray-200" />

            <Button size="sm" onClick={() => setShowAddTable(true)}>
              <Plus size={14} /> Table
            </Button>

            {/* Zone dropdown */}
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Plus size={14} /> Zone ▾
              </Button>
              <div className="absolute left-0 top-full z-50 hidden w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg group-hover:block group-focus-within:block">
                {ZONE_PRESETS.map((z) => {
                  const ZIcon = z.icon;
                  return (
                    <button key={z.type} onClick={() => addZone(z)}
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 flex items-center gap-2">
                      <ZIcon size={14} className="text-gray-500" /> {z.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={() => setShowPresets(true)}>
              Layout Presets
            </Button>

            {(tables.length > 0 || zones.length > 0) && (
              <Button variant="outline" size="sm" onClick={() => {
                if (window.confirm('Reset this layout? All tables and zones will be cleared.')) {
                  setTables([]);
                  setZones([]);
                  setHasChanges(true);
                }
              }}>
                <RotateCcw size={14} /> Reset
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={14} /> Import
            </Button>

            <Button variant="outline" size="sm" onClick={() => setShowRules(true)}>
              <ShieldAlert size={14} /> Rules
            </Button>

            {unassignedGuests.length > 0 && tables.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleAutoSuggest} className="border-purple-300 text-purple-700 hover:bg-purple-50">
                <Wand2 size={14} /> Auto-Seat
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={() => setShowQrModal(true)} disabled={!selectedEventId}>
              <QrCode size={14} /> QR Code
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportSeating} disabled={tables.length === 0}>
              <FileSpreadsheet size={14} /> Export
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={tables.length === 0 || isDownloadingPdf}>
              <Download size={14} /> {isDownloadingPdf ? 'Creating PDF' : 'Download PDF'}
            </Button>

            {/* Venue floor plan (image or PDF, auto-compressed) */}
            <label className="cursor-pointer">
              <input type="file" accept={FLOOR_PLAN_ACCEPT} className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  try {
                    const { dataUrl } = await loadFloorPlan(file);
                    setVenueImage(dataUrl);
                    setHasChanges(true);
                  } catch (err) {
                    toast.error('Could not load floor plan: ' + err.message);
                  }
                }}
              />
              <span className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
                <Image size={14} /> {venueImage ? 'Change' : 'Floor Plan'}
              </span>
            </label>

            {venueImage && (
              <>
                <input type="range" min="5" max="80" value={venueOpacity * 100}
                  onChange={(e) => { setVenueOpacity(parseInt(e.target.value) / 100); setHasChanges(true); }}
                  className="w-16 h-1 accent-wine-600" title={`Opacity: ${Math.round(venueOpacity * 100)}%`} />
                <Button variant="outline" size="sm" onClick={() => { setVenueImage(null); setHasChanges(true); }}>
                  ✕ BG
                </Button>
              </>
            )}

            {undoStack.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleUndo} title="Undo (Ctrl+Z)">
                <RotateCcw size={14} /> Undo
              </Button>
            )}

            {hasChanges && (
              <Button size="sm" onClick={handleSave}>
                <Save size={14} /> Save
              </Button>
            )}
          </div>

          {/* Capacity summary bar */}
          {tables.length > 0 && (
            <div className="mb-3 flex items-center gap-3 text-xs text-gray-500">
              <div className="capacity-bar flex-1">
                <div
                  className={`capacity-bar-fill ${
                    assignedGuestIds.size > tables.reduce((s, t) => s + t.capacity, 0) ? 'bg-red-500' :
                    assignedGuestIds.size === tables.reduce((s, t) => s + t.capacity, 0) ? 'bg-green-500' : 'bg-wine-500'
                  }`}
                  style={{ width: `${Math.min((assignedGuestIds.size / Math.max(tables.reduce((s, t) => s + t.capacity, 0), 1)) * 100, 100)}%` }}
                />
              </div>
              <span className="font-medium">{assignedGuestIds.size}/{tables.reduce((s, t) => s + t.capacity, 0)} seats filled</span>
              <span className="text-gray-400">{tables.length} tables</span>
              {(() => {
                const seated = guests.filter((g) => assignedGuestIds.has(g.id));
                const bride = seated.filter((g) => g.side === 'bride').length;
                const groom = seated.filter((g) => g.side === 'groom').length;
                if (bride + groom === 0) return null;
                return <span>• <span className="text-pink-600">{bride}B</span>/<span className="text-blue-600">{groom}G</span></span>;
              })()}
            </div>
          )}

          {/* Canvas */}
          {ruleEvaluation.violationCount > 0 && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" />
                <span>
                  {ruleEvaluation.violationCount} seating rule violation{ruleEvaluation.violationCount === 1 ? '' : 's'} across {ruleEvaluation.tablesWithWarnings} table{ruleEvaluation.tablesWithWarnings === 1 ? '' : 's'}.
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowRules(true)} className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
                Review Rules
              </Button>
            </div>
          )}

          <div ref={canvasScrollRef} className="seating-print-area relative z-0 flex-1 rounded-2xl border border-gray-200/60 overflow-auto venue-canvas seating-scroll shadow-venue">
            {events.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Add events first to start seating</p>
              </div>
            ) : tables.length === 0 && zones.length === 0 && !venueImage ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                <Grid3XIcon />
                <p className="font-medium">Set up your venue layout</p>
                <p className="text-xs max-w-sm text-center">Upload a venue floor plan, pick a preset layout, or add tables one by one.</p>
                <div className="flex gap-2 flex-wrap justify-center">
                  <Button size="sm" onClick={() => setShowPresets(true)}>Layout Presets</Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddTable(true)}>
                    <Plus size={14} /> Add Table
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
                    <Upload size={14} /> Import
                  </Button>
                </div>
              </div>
            ) : (
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: '3000px',
                  height: '2000px',
                  position: 'relative',
                  minWidth: '3000px',
                  minHeight: '2000px',
                }}
              >
                {/* Venue floor plan background */}
                {venueImage && (
                  <img src={venueImage} alt="Venue layout"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', opacity: venueOpacity, pointerEvents: 'none', userSelect: 'none' }}
                    draggable={false} />
                )}

                {/* Zones (dance floor, DJ, bar, etc.) */}
                {zones.map((zone) => (
                  <ZoneElement key={zone.id} zone={zone}
                    onUpdate={(updates) => updateZone(zone.id, updates)}
                    onMove={(x, y) => handleZoneMove(zone.id, x, y)}
                    onRemove={() => removeZone(zone.id)}
                    zoom={zoom} />
                ))}

                {/* Tables */}
                {tables.map((table) => (
                  <TableComponent
                    key={table.id}
                    table={table}
                    guests={guests}
                    warnings={ruleEvaluation.tableWarnings[table.id] || []}
                    selected={detailTableId === table.id}
                    onUpdate={(updates) => updateTable(table.id, updates)}
                    onRemove={() => removeTable(table.id)}
                    onDrag={(dx, dy) => handleTableDrag(table.id, dx, dy)}
                    onOpenDetail={() => setDetailTableId(table.id)}
                    onRemoveGuest={(guestId) => {
                      setTables((prev) => prev.map((t) =>
                        t.id === table.id
                          ? { ...t, assignedGuests: (t.assignedGuests || []).filter((id) => id !== guestId) }
                          : t
                      ));
                      setHasChanges(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>{tables.length} tables</span>
            {zones.length > 0 && <span>{zones.length} zones</span>}
            <span>{assignedGuestIds.size} / {guests.length} guests seated</span>
            <span>{guests.length - assignedGuestIds.size} unassigned</span>
            <span>{tables.reduce((s, t) => s + t.capacity, 0)} total capacity</span>
            {rules.length > 0 && <span>{rules.length} rules</span>}
            {ruleEvaluation.violationCount > 0 && <span className="text-amber-600">{ruleEvaluation.violationCount} warnings</span>}
            {saveState === 'saving' && <span className="text-blue-600 animate-pulse">⏳ Saving...</span>}
            {saveState === 'saved' && <span className="text-green-600">✓ Saved</span>}
            {hasChanges && saveState === 'idle' && <span className="text-amber-600">● Unsaved changes</span>}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {draggedGuest && (
          <div className="rounded-lg bg-wine-700 text-white px-3 py-1.5 text-sm font-medium shadow-lg">
            {draggedGuest.firstName} {draggedGuest.lastName}
          </div>
        )}
      </DragOverlay>

      {/* Add Table modal — presets + custom */}
      <Modal open={showAddTable} onClose={() => setShowAddTable(false)} title="Add Table" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Choose a preset or create a custom table:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TABLE_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => addTable(preset)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 hover:bg-wine-50 hover:border-wine-200 transition-colors text-left"
              >
                <TableShapeIcon shape={preset.shape} />
                <div>
                  <div className="text-sm font-medium text-gray-900">{preset.label}</div>
                  <div className="text-xs text-gray-400">{preset.capacity} seats · {preset.width}×{preset.height}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => { setShowAddTable(false); setShowCustom(true); }}
              className="w-full text-center text-sm text-wine-700 font-medium hover:text-wine-800 py-2"
            >
              + Create Custom Table
            </button>
          </div>
        </div>
      </Modal>

      {/* Custom Table modal */}
      <Modal open={showCustom} onClose={() => setShowCustom(false)} title="Custom Table" size="sm">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table Name</label>
            <input
              value={customTable.name}
              onChange={(e) => setCustomTable({ ...customTable, name: e.target.value })}
              placeholder={`Table ${tables.length + 1}`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shape</label>
            <select
              value={customTable.shape}
              onChange={(e) => {
                const shape = e.target.value;
                const defaults = TABLE_DEFAULTS[shape] || TABLE_DEFAULTS.round;
                setCustomTable({ ...customTable, shape, width: defaults.width, height: defaults.height, capacity: defaults.capacity });
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="round">Round</option>
              <option value="rectangle">Rectangle</option>
              <option value="square">Square</option>
              <option value="oval">Oval</option>
              <option value="u-shape">U-Shape</option>
              <option value="head-table">Head Table</option>
              <option value="cocktail">Cocktail/Standing</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Seats</label>
              <input type="number" min="1" max="50" value={customTable.capacity}
                onChange={(e) => setCustomTable({ ...customTable, capacity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Width</label>
              <input type="number" min="40" max="500" value={customTable.width}
                onChange={(e) => setCustomTable({ ...customTable, width: parseInt(e.target.value) || 100 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Height</label>
              <input type="number" min="40" max="500" value={customTable.height}
                onChange={(e) => setCustomTable({ ...customTable, height: parseInt(e.target.value) || 100 })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <Button className="w-full" onClick={() => { addTable(customTable); setShowCustom(false); }}>
            Add Table
          </Button>
        </div>
      </Modal>

      {/* Import Layout modal */}
      <Modal open={showImport} onClose={() => setShowImport(false)} title="Import Seating Layout" size="md">
        <ImportLayoutPanel onImport={addTablesBatch} onClose={() => setShowImport(false)} existingCount={tables.length} />
      </Modal>

      {/* Venue Layout Presets modal */}
      <Modal open={showPresets} onClose={() => setShowPresets(false)} title="Venue Layout Presets" size="lg">
        <VenuePresetsPanel 
          onApply={applyPreset} 
          onClose={() => setShowPresets(false)}
          onApplyGenerator={applyLayoutGenerator}
        />
      </Modal>

      <RulesPanel
        open={showRules}
        onClose={() => setShowRules(false)}
        rules={rules}
        guests={guests}
        tables={tables}
        violations={ruleEvaluation.violations}
        onChange={handleRulesChange}
        onFocusTable={handleFocusTable}
      />

      <TableDetailModal
        tables={tables}
        guests={guests}
        tableId={detailTableId}
        onClose={() => setDetailTableId(null)}
        onMoveGuest={moveGuestToTable}
      />

      <Modal open={showQrModal} onClose={() => setShowQrModal(false)} title="Table Finder QR Code" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Share this QR code so guests can search their name and find their assigned table{selectedEvent ? ` for ${selectedEvent.name}` : ''}.
          </p>

          <div ref={qrPrintRef} className="rounded-3xl border border-wine-100 bg-gradient-to-br from-wine-50 to-white p-6 text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-wine-600">
              {selectedEvent?.name || 'Table Finder'}
            </div>
            <h3 className="mt-2 text-2xl font-bold text-gray-900">Find Your Table</h3>
            <p className="mt-2 text-sm text-gray-500">Scan to see your seat and tablemates instantly.</p>

            {finderLink && (
              <div className="mt-5 flex justify-center">
                <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
                  <QRCodeSVG value={finderLink} size={220} includeMargin />
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Shareable Link</label>
            <div className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 break-all">
              {finderLink || 'Select an event to generate the guest link.'}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" className="flex-1" onClick={handleCopyFinderLink} disabled={!finderLink}>
              {copiedFinderLink ? <Check size={14} /> : <Copy size={14} />}
              {copiedFinderLink ? 'Copied' : 'Copy Link'}
            </Button>
            <Button className="flex-1" onClick={handlePrintQr} disabled={!finderLink}>
              Print QR Sign
            </Button>
          </div>
        </div>
      </Modal>
    </DndContext>
      </div>
    </>
  );
}

function ImportLayoutPanel({ onImport, onClose, existingCount }) {
  const [mode, setMode] = useState('quick'); // 'quick' | 'excel' | 'text'
  const [quickCount, setQuickCount] = useState(10);
  const [quickShape, setQuickShape] = useState('round');
  const [quickCapacity, setQuickCapacity] = useState(10);
  const [textInput, setTextInput] = useState('');
  const [fileData, setFileData] = useState(null);
  const [preview, setPreview] = useState([]);
  const [parseError, setParseError] = useState('');

  // Quick-add: generate N tables of same shape
  const handleQuickAdd = () => {
    const configs = createQuickTableConfigs({
      count: quickCount,
      shape: quickShape,
      capacity: quickCapacity,
      existingCount,
    });
    onImport(configs);
  };

  // Parse text input. Supports:
  //   "Name, Shape/Type, Seats"                       (simple)
  //   "Name, Type, Seats, X, Y[, W, H]"               (with coordinates)
  // Zone rows (dance floor, stage, dj, bar, gifts…) are auto-detected by type.
  const handleTextParse = () => {
    const configs = parseSeatingText(textInput);
    setPreview(configs);
    setParseError(configs.length === 0 ? 'No valid tables or zones were found. Check the example format and try again.' : '');
  };

  // Handle Excel/CSV file. Detects columns by header when present:
  // Name, Shape/Type, Seats/Capacity, X, Y, Width, Height.
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const configs = parseSpreadsheetRows(rows);

      setFileData(file.name);
      setPreview(configs);
      setParseError(configs.length === 0 ? 'This file does not contain any valid tables or zones.' : '');
    } catch (err) {
      console.error('File parse error:', err);
      setPreview([]);
      setParseError('We could not read this file. Use a valid Excel or CSV file and try again.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {[
          { id: 'quick', label: 'Quick Add', icon: Plus },
          { id: 'text', label: 'Paste List', icon: FileSpreadsheet },
          { id: 'excel', label: 'Excel File', icon: Upload },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => { setMode(id); setPreview([]); setParseError(''); }}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
              mode === id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* Quick add */}
      {mode === 'quick' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Add multiple identical tables at once:</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Count</label>
              <input type="number" min="1" max="100" value={quickCount}
                onChange={(e) => setQuickCount(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Shape</label>
              <select value={quickShape} onChange={(e) => setQuickShape(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="round">Round</option>
                <option value="rectangle">Rectangle</option>
                <option value="square">Square</option>
                <option value="oval">Oval</option>
                <option value="u-shape">U-Shape</option>
                <option value="head-table">Head Table</option>
                <option value="cocktail">Cocktail</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Seats each</label>
              <input type="number" min="1" max="50" value={quickCapacity}
                onChange={(e) => setQuickCapacity(parseInt(e.target.value) || 1)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
          <Button className="w-full" onClick={handleQuickAdd}>
            Add {quickCount} Tables
          </Button>
        </div>
      )}

      {/* Text paste */}
      {mode === 'text' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Paste your layout (one item per line):</p>
          <p className="text-xs text-gray-400">Format: <code className="bg-gray-100 px-1 rounded">Name, Type, Seats, X, Y</code> — X/Y optional. Zones (dance floor, stage, DJ, bar, gifts…) are detected automatically.</p>
          <textarea
            value={textInput}
            onChange={(e) => { setTextInput(e.target.value); setParseError(''); }}
            placeholder={`Head Table, head-table, 12, 700, 60\nTable 1, round, 10, 100, 250\nTable 2, round, 10, 320, 250\nDance Floor, dance-floor, , 620, 500\nDJ Booth, dj, , 900, 780`}
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleTextParse}>Preview</Button>
            {preview.length > 0 && (
              <Button className="flex-1" onClick={() => onImport(preview)}>
                Import {preview.length} Item{preview.length === 1 ? '' : 's'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Excel upload */}
      {mode === 'excel' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Upload an Excel or CSV. Columns: <strong>Name, Type, Seats, X, Y, Width, Height</strong></p>
          <p className="text-xs text-gray-400">
            Headers are auto-detected in any order. Include X/Y to place items exactly where your
            floor plan has them; otherwise we lay tables out in a tidy grid. Zone rows
            (dance floor, stage, DJ, bar, gifts, cake) are recognized automatically.
          </p>
          <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 p-6 cursor-pointer hover:bg-gray-50 transition-colors">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500">{fileData || 'Drop file or click to upload'}</span>
            <span className="text-xs text-gray-400">.xlsx, .xls, .csv</span>
            <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileUpload} />
          </label>
          {preview.length > 0 && (
            <Button className="w-full" onClick={() => onImport(preview)}>
              Import {preview.length} Item{preview.length === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      )}

      {parseError && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {parseError}
        </p>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-3 py-1.5 font-medium text-gray-600">Name</th>
                <th className="text-left px-3 py-1.5 font-medium text-gray-600">Type</th>
                <th className="text-center px-3 py-1.5 font-medium text-gray-600">Seats</th>
                <th className="text-center px-3 py-1.5 font-medium text-gray-600">Position</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((t, i) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="px-3 py-1.5 text-gray-800">
                    {t.name}
                    {t.__zone && <span className="ml-1 rounded bg-wine-50 px-1 text-[9px] font-semibold uppercase text-wine-600">zone</span>}
                  </td>
                  <td className="px-3 py-1.5 text-gray-500 capitalize">{t.__zone ? t.type : t.shape}</td>
                  <td className="px-3 py-1.5 text-center text-gray-500">{t.__zone ? '—' : t.capacity}</td>
                  <td className="px-3 py-1.5 text-center text-gray-400">
                    {Number.isFinite(t.x) && Number.isFinite(t.y) ? `${Math.round(t.x)}, ${Math.round(t.y)}` : 'auto'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Grid3XIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

// ─── Zone element (non-seatable, draggable) ─────────────────────────────────

function ZoneElement({ zone, onUpdate, onMove, onRemove, zoom }) {
  const dragStart = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(zone.label);

  const handleGripDown = useCallback((e) => {
    const isTouch = e.type === 'touchstart';
    if (isTouch) e.preventDefault();
    e.stopPropagation();
    const clientX = isTouch ? e.touches[0].clientX : e.clientX;
    const clientY = isTouch ? e.touches[0].clientY : e.clientY;
    // Capture the pointer origin AND the zone origin once, then drive an
    // absolute position from the total delta (prevents per-frame jitter).
    dragStart.current = { px: clientX, py: clientY, zx: zone.x || 0, zy: zone.y || 0 };
    const handleMove = (me) => {
      if (!dragStart.current) return;
      const cx = me.touches ? me.touches[0].clientX : me.clientX;
      const cy = me.touches ? me.touches[0].clientY : me.clientY;
      const nextX = dragStart.current.zx + (cx - dragStart.current.px) / zoom;
      const nextY = dragStart.current.zy + (cy - dragStart.current.py) / zoom;
      if (onMove) onMove(nextX, nextY);
      else onUpdate({ x: nextX, y: nextY });
    };
    const handleUp = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);
  }, [zone.x, zone.y, zoom, onUpdate, onMove]);

  const zonePreset = ZONE_PRESETS.find((z) => z.type === zone.type);
  const ZoneIcon = zonePreset?.icon || CircleDot;
  const isDanceFloor = zone.type === 'dancefloor' || zone.type === 'dance-floor';

  return (
    <div
      style={{
        position: 'absolute',
        left: zone.x || 400,
        top: zone.y || 200,
        width: zone.width,
        height: zone.height,
      }}
      className="group"
    >
      <div
        style={{ backgroundColor: zone.color || '#f3f4f6' }}
        className={`w-full h-full rounded-xl ${isDanceFloor ? 'zone-dancefloor' : ''} ${zone.type === 'stage' || zone.type === 'dj' ? 'zone-stage' : ''} ${zone.type === 'bar' ? 'zone-bar' : ''} border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing zone-element`}
        onMouseDown={handleGripDown}
        onTouchStart={handleGripDown}
      >
        <ZoneIcon size={Math.min(zone.width, zone.height) * 0.2} className="text-gray-500 opacity-60 pointer-events-none" />
        {isEditing ? (
          <input
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            onBlur={() => { onUpdate({ label: editLabel }); setIsEditing(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onUpdate({ label: editLabel }); setIsEditing(false); } }}
            className="text-xs font-semibold text-gray-700 bg-white rounded px-1 py-0.5 border text-center w-24"
            autoFocus
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-xs font-semibold text-gray-600 pointer-events-none">{zone.label}</span>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:flex gap-1 bg-white rounded-lg shadow-lg border border-gray-200 px-1.5 py-1 z-10">
        <button onClick={() => setIsEditing(true)} className="p-1 rounded hover:bg-gray-100 text-gray-500" title="Rename">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </button>
        <button onClick={onRemove} className="p-1 rounded hover:bg-red-50 text-red-500" title="Remove">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.clientX;
          const startY = e.clientY;
          const startW = zone.width;
          const startH = zone.height;
          const handleMove = (me) => {
            const cx = me.touches ? me.touches[0].clientX : me.clientX;
            const cy = me.touches ? me.touches[0].clientY : me.clientY;
            onUpdate({
              width: Math.max(60, startW + (cx - startX) / zoom),
              height: Math.max(40, startH + (cy - startY) / zoom),
            });
          };
          const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
          };
          window.addEventListener('mousemove', handleMove);
          window.addEventListener('mouseup', handleUp);
          window.addEventListener('touchmove', handleMove, { passive: false });
          window.addEventListener('touchend', handleUp);
        }}
        onTouchStart={(e) => {
          e.stopPropagation();
          e.preventDefault();
          const startX = e.touches[0].clientX;
          const startY = e.touches[0].clientY;
          const startW = zone.width;
          const startH = zone.height;
          const handleMove = (me) => {
            const cx = me.touches ? me.touches[0].clientX : me.clientX;
            const cy = me.touches ? me.touches[0].clientY : me.clientY;
            onUpdate({
              width: Math.max(60, startW + (cx - startX) / zoom),
              height: Math.max(40, startH + (cy - startY) / zoom),
            });
          };
          const handleUp = () => {
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('touchend', handleUp);
          };
          window.addEventListener('touchmove', handleMove, { passive: false });
          window.addEventListener('touchend', handleUp);
        }}
      >
        <svg viewBox="0 0 10 10" className="w-3 h-3 text-gray-400">
          <path d="M9 1L1 9M9 5L5 9M9 9L9 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
      </div>
    </div>
  );
}

// ─── Venue layout presets ───────────────────────────────────────────────────
// Each table element renders at (table.width + 80) x (table.height + 60) due to
// chip positioning padding. Spacing must account for this.

const VENUE_LAYOUTS = (() => {
  const S = 220; // tighter spacing for round tables (120w + 60 pad + 40gap)
  const round10 = { shape: 'round', capacity: 10, width: 120, height: 120 };
  const round8 = { shape: 'round', capacity: 8, width: 110, height: 110 };

  // Stagger helper: generates tables on left/right with alternating row offsets
  // for better viewing angles and intimate feel
  function staggeredSides(leftX, rightX, startY, rows, spacing, offset, config) {
    const t = []; let n = 0;
    for (let r = 0; r < rows; r++) {
      const stagger = r % 2 === 1 ? offset : 0;
      t.push({ ...config, name: `Table ${++n}`, x: leftX + stagger, y: startY + r * spacing });
      t.push({ ...config, name: `Table ${++n}`, x: rightX - stagger, y: startY + r * spacing });
    }
    return t;
  }

  return [
    {
      name: 'Large Reception (30 rounds)',
      description: 'Head table at top, stage at bottom, staggered tables left & right of dance floor',
      icon: Grid3X3,
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 12, width: 340, height: 60, x: 730, y: 60 },
        ...(() => {
          const t = []; let n = 0;
          // Left side — 2 staggered columns × 7 rows (close to dance floor)
          for (let r = 0; r < 7; r++) {
            const stagger = r % 2 === 1 ? 50 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 80 + stagger, y: 220 + r * S });
            t.push({ ...round10, name: `Table ${++n}`, x: 280 + stagger, y: 220 + r * S });
          }
          // Right side — 2 staggered columns × 7 rows
          for (let r = 0; r < 7; r++) {
            const stagger = r % 2 === 1 ? -50 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 1300 + stagger, y: 220 + r * S });
            t.push({ ...round10, name: `Table ${++n}`, x: 1500 + stagger, y: 220 + r * S });
          }
          return t.slice(0, 28);
        })(),
        { ...round10, name: 'Table 29', x: 450, y: 60 },
        { ...round10, name: 'Table 30', x: 1150, y: 60 },
      ],
      zones: [
        { type: 'stage', label: 'Stage / DJ', width: 400, height: 90, x: 700, y: 1800, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 420, height: 420, x: 690, y: 600, color: '#fef3c7' },
        { type: 'bar', label: 'Bar', width: 180, height: 60, x: 80, y: 1800, color: '#dbeafe' },
        { type: 'desserts', label: 'Desserts', width: 150, height: 60, x: 1550, y: 1800, color: '#fef9c3' },
      ],
    },
    {
      name: 'Medium Reception (20 rounds)',
      description: 'Head table at top, stage at bottom, staggered rounds on each side',
      icon: CircleDot,
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 10, width: 300, height: 60, x: 650, y: 60 },
        ...(() => {
          const t = []; let n = 0;
          // Left side staggered (2 cols × 5 rows)
          for (let r = 0; r < 5; r++) {
            const stagger = r % 2 === 1 ? 40 : 0;
            t.push({ ...round8, name: `Table ${++n}`, x: 80 + stagger, y: 220 + r * S });
            t.push({ ...round8, name: `Table ${++n}`, x: 280 + stagger, y: 220 + r * S });
          }
          // Right side staggered (2 cols × 5 rows)
          for (let r = 0; r < 5; r++) {
            const stagger = r % 2 === 1 ? -40 : 0;
            t.push({ ...round8, name: `Table ${++n}`, x: 1180 + stagger, y: 220 + r * S });
            t.push({ ...round8, name: `Table ${++n}`, x: 1380 + stagger, y: 220 + r * S });
          }
          return t.slice(0, 20);
        })(),
      ],
      zones: [
        { type: 'stage', label: 'Stage / DJ', width: 350, height: 90, x: 630, y: 1350, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 360, height: 360, x: 620, y: 450, color: '#fef3c7' },
      ],
    },
    {
      name: 'Estate Hall (mixed)',
      description: 'Head table at top, stage at bottom, staggered estate tables on sides',
      icon: Square,
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 14, width: 360, height: 60, x: 650, y: 60 },
        // Left side: 3 staggered estate tables
        { name: 'Estate 1', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 80, y: 250 },
        { name: 'Estate 2', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 130, y: 450 },
        { name: 'Estate 3', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 80, y: 650 },
        // Right side: 3 staggered estate tables
        { name: 'Estate 4', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 1280, y: 250 },
        { name: 'Estate 5', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 1230, y: 450 },
        { name: 'Estate 6', shape: 'rectangle', capacity: 16, width: 280, height: 70, x: 1280, y: 650 },
        // Round tables below dance floor
        ...Array.from({ length: 6 }, (_, i) => ({
          ...round10, name: `Table ${i + 1}`,
          x: 120 + i * 280, y: 950,
        })),
      ],
      zones: [
        { type: 'stage', label: 'Stage / DJ', width: 350, height: 90, x: 660, y: 1200, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 400, height: 350, x: 630, y: 300, color: '#fef3c7' },
        { type: 'bar', label: 'Bar', width: 180, height: 60, x: 80, y: 1200, color: '#dbeafe' },
      ],
    },
    {
      name: 'Indian Wedding Reception (40 rounds)',
      description: 'Head table at top, stage/DJ at bottom, staggered tables left & right of dance floor',
      icon: Wine,
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 14, width: 400, height: 60, x: 750, y: 60 },
        ...(() => {
          const t = []; let n = 0;
          // Left side — 3 staggered columns × 7 rows
          for (let r = 0; r < 7; r++) {
            const stagger = r % 2 === 1 ? 45 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 60 + stagger, y: 250 + r * 210 });
            t.push({ ...round10, name: `Table ${++n}`, x: 250 + stagger, y: 250 + r * 210 });
            t.push({ ...round10, name: `Table ${++n}`, x: 440 + stagger, y: 250 + r * 210 });
          }
          // Right side — 3 staggered columns × 7 rows
          for (let r = 0; r < 7; r++) {
            const stagger = r % 2 === 1 ? -45 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 1360 + stagger, y: 250 + r * 210 });
            t.push({ ...round10, name: `Table ${++n}`, x: 1550 + stagger, y: 250 + r * 210 });
            t.push({ ...round10, name: `Table ${++n}`, x: 1740 + stagger, y: 250 + r * 210 });
          }
          return t.slice(0, 40);
        })(),
      ],
      zones: [
        { type: 'stage', label: 'Stage', width: 450, height: 100, x: 730, y: 1800, color: '#fee2e2' },
        { type: 'dj', label: 'DJ', width: 130, height: 60, x: 890, y: 1680, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 460, height: 460, x: 720, y: 550, color: '#fef3c7' },
        { type: 'bar', label: 'Bar', width: 180, height: 60, x: 60, y: 1800, color: '#dbeafe' },
        { type: 'desserts', label: 'Desserts', width: 160, height: 60, x: 1750, y: 1800, color: '#fef9c3' },
        { type: 'gifts', label: 'Gifts & Cards', width: 140, height: 70, x: 1750, y: 60, color: '#fce7f3' },
        { type: 'photo', label: 'Photo Booth', width: 140, height: 80, x: 60, y: 60, color: '#f3e8ff' },
      ],
    },
    {
      name: 'Intimate Dinner (10 rounds)',
      description: 'Sweetheart table at top, staggered tables left & right of dance floor',
      icon: Cake,
      tables: [
        { name: 'Sweetheart', shape: 'round', capacity: 2, width: 70, height: 70, x: 650, y: 60 },
        // Left staggered (5)
        ...Array.from({ length: 5 }, (_, i) => ({
          ...round8, name: `Table ${i + 1}`,
          x: 150 + (i % 2 === 1 ? 40 : 0), y: 220 + i * S,
        })),
        // Right staggered (5)
        ...Array.from({ length: 5 }, (_, i) => ({
          ...round8, name: `Table ${i + 6}`,
          x: 1050 - (i % 2 === 1 ? 40 : 0), y: 220 + i * S,
        })),
      ],
      zones: [
        { type: 'dancefloor', label: 'Dance Floor', width: 320, height: 320, x: 540, y: 350, color: '#fef3c7' },
      ],
    },
    {
      name: 'Estate Tables + Stage (25 rounds)',
      description: 'Head table at top, stage/DJ at bottom, 3 estate tables in U around stage, staggered rounds on sides',
      icon: Gift,
      tables: [
        { name: 'Head Table', shape: 'head-table', capacity: 14, width: 400, height: 60, x: 700, y: 60 },
        // 3 estate tables in U-shape around stage at bottom
        { name: 'Estate Left', shape: 'rectangle', capacity: 14, width: 70, height: 300, x: 550, y: 1200 },
        { name: 'Estate Center', shape: 'rectangle', capacity: 16, width: 360, height: 70, x: 720, y: 1550 },
        { name: 'Estate Right', shape: 'rectangle', capacity: 14, width: 70, height: 300, x: 1180, y: 1200 },
        // Left side staggered rounds (2 cols × 5 rows = 10)
        ...(() => {
          const t = []; let n = 0;
          for (let r = 0; r < 5; r++) {
            const stagger = r % 2 === 1 ? 40 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 60 + stagger, y: 220 + r * S });
            t.push({ ...round10, name: `Table ${++n}`, x: 260 + stagger, y: 220 + r * S });
          }
          return t;
        })(),
        // Right side staggered rounds (2 cols × 5 rows = 10)
        ...(() => {
          const t = []; let n = 10;
          for (let r = 0; r < 5; r++) {
            const stagger = r % 2 === 1 ? -40 : 0;
            t.push({ ...round10, name: `Table ${++n}`, x: 1400 + stagger, y: 220 + r * S });
            t.push({ ...round10, name: `Table ${++n}`, x: 1600 + stagger, y: 220 + r * S });
          }
          return t;
        })(),
        { ...round8, name: 'Table 21', x: 400, y: 60 },
      ],
      zones: [
        { type: 'stage', label: 'Stage / DJ', width: 360, height: 100, x: 720, y: 1680, color: '#e0e7ff' },
        { type: 'dancefloor', label: 'Dance Floor', width: 420, height: 380, x: 690, y: 420, color: '#fef3c7' },
        { type: 'bar', label: 'Bar', width: 180, height: 60, x: 60, y: 1550, color: '#dbeafe' },
      ],
    },
    {
      name: 'Ceremony: Mandap with Arc Seating',
      description: 'Individual chairs fanned in arcs around a central aisle, all facing the mandap',
      icon: Wand2,
      tables: (() => {
        // Individual chairs (capacity 1) arranged in concentric arcs centred on
        // the mandap so every seat has a clear view. A central aisle splits the
        // fan; outer rows are wider and hold more chairs.
        const chairs = [];
        const Fx = 1200;          // focal point (mandap centre) x
        const Fy = 300;           // focal point y — chairs sit below, facing up
        const chairSize = 34;
        const rowCount = 6;
        const R0 = 300;           // radius of the front row from the focal point
        const rowGap = 62;        // radial spacing between rows
        const halfSpan = (78 * Math.PI) / 180;  // fan half-width
        const aisleHalf = (7 * Math.PI) / 180;  // central walkway half-angle
        const seatArc = 56;       // target arc distance between chairs
        let n = 0;
        for (let r = 0; r < rowCount; r++) {
          const R = R0 + r * rowGap;
          const count = Math.max(6, Math.round((2 * halfSpan * R) / seatArc));
          for (let i = 0; i < count; i++) {
            const theta = count === 1 ? 0 : -halfSpan + (i * (2 * halfSpan)) / (count - 1);
            if (Math.abs(theta) < aisleHalf) continue; // leave the aisle open
            const cx = Fx + R * Math.sin(theta);
            const cy = Fy + R * Math.cos(theta);
            chairs.push({
              name: `S${++n}`,
              shape: 'square',
              capacity: 1,
              width: chairSize,
              height: chairSize,
              // convert desired chair centre → stored top-left (shape offset 40/30)
              x: cx - 40 - chairSize / 2,
              y: cy - 30 - chairSize / 2,
              rotation: Math.round((theta * 180) / Math.PI), // fan toward the mandap
            });
          }
        }
        return chairs;
      })(),
      zones: [
        { type: 'stage', label: 'Mandap', width: 300, height: 220, x: 1050, y: 60, color: '#fee2e2' },
        { type: 'custom', label: 'Aisle', width: 70, height: 620, x: 1165, y: 320, color: '#f1f5f9' },
        { type: 'entrance', label: 'Entrance', width: 140, height: 50, x: 1130, y: 980, color: '#f1f5f9' },
      ],
    },
  ];
})();

// Small shape indicator for table presets (replaces emojis)
function TableShapeIcon({ shape }) {
  const base = "w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center bg-gray-100";
  switch (shape) {
    case 'round': return <div className={base}><Circle size={16} className="text-gray-500" /></div>;
    case 'rectangle': return <div className={base}><Minus size={16} className="text-gray-500" /></div>;
    case 'square': return <div className={base}><Square size={14} className="text-gray-500" /></div>;
    case 'oval': return <div className={base}><Circle size={16} className="text-gray-500 scale-x-150" /></div>;
    case 'head-table': return <div className={base}><Minus size={18} className="text-gray-500" /></div>;
    default: return <div className={base}><Grid3X3 size={14} className="text-gray-500" /></div>;
  }
}

function VenuePresetsPanel({ onApply, onClose, onApplyGenerator }) {
  const [tab, setTab] = useState('presets'); // 'presets' or 'event-layouts'

  const eventLayouts = [
    {
      id: 'indianWedding',
      name: 'Indian Wedding Reception',
      description: 'Mandap/stage, bride & groom family sides, dance floor, bar, cocktail area',
      icon: Wine,
    },
    {
      id: 'mehendi',
      name: 'Mehendi Celebration',
      description: 'Casual layout with performance stage, dance area, cocktail seating',
      icon: Music,
    },
    {
      id: 'reception',
      name: 'Formal Reception',
      description: 'Head table, circular arrangement, stage, dance floor',
      icon: Grid3X3,
    },
    {
      id: 'staggered',
      name: 'Staggered Seating',
      description: 'Organic, non-grid arrangement with offset rows',
      icon: Wand2,
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Choose a layout based on your venue type or event. You can customize tables and zones after.
      </p>
      <p className="text-xs text-amber-600 font-medium flex items-center gap-1"><AlertTriangle size={13} /> This will replace your current layout.</p>

      {/* Tab selector */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('presets')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'presets'
              ? 'text-wine-700 border-wine-300'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Venue Presets
        </button>
        <button
          onClick={() => setTab('event-layouts')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'event-layouts'
              ? 'text-wine-700 border-wine-300'
              : 'text-gray-500 border-transparent hover:text-gray-700'
          }`}
        >
          Event Layouts
        </button>
      </div>

      {/* Venue Presets */}
      {tab === 'presets' && (
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {VENUE_LAYOUTS.map((layout, i) => (
            <button
              key={i}
              onClick={() => {
                if (confirm(`Apply "${layout.name}"? This replaces your current tables and zones.`)) {
                  onApply(layout);
                }
              }}
              className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-wine-50 hover:border-wine-200 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-wine-50 flex items-center justify-center text-wine-600">
                {layout.icon && <layout.icon size={18} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{layout.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{layout.description}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {layout.tables.length} tables · {layout.tables.reduce((s, t) => s + t.capacity, 0)} seats
                  {layout.zones.length > 0 && ` · ${layout.zones.length} zones`}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Event Layouts */}
      {tab === 'event-layouts' && (
        <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
          {eventLayouts.map((layout) => (
            <button
              key={layout.id}
              onClick={() => {
                if (confirm(`Apply "${layout.name}"? This will create an optimized layout based on your guest count.`)) {
                  onApplyGenerator(layout.id);
                }
              }}
              className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-wine-50 hover:border-wine-200 transition-colors text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-wine-50 flex items-center justify-center text-wine-600">
                {layout.icon && <layout.icon size={18} />}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{layout.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{layout.description}</div>
                <div className="text-xs text-gray-400 mt-1">
                  Auto-calculated tables based on guest count
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
