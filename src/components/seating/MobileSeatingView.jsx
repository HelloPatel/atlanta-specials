import { useState, useEffect, useMemo } from 'react';
import { useWedding } from '../../contexts/WeddingContext';
import { subscribeToGuests } from '../../services/guestService';
import { subscribeToEvents } from '../../services/eventService';
import { subscribeToSeating } from '../../services/seatingService';
import { evaluateSeatingRules } from './seatingRules';

/**
 * Lightweight mobile seating view. No @dnd-kit imports at all.
 * Renders tables as simple styled divs with tap-to-view guest list.
 */
export default function MobileSeatingView() {
  const { activeWedding } = useWedding();
  const [guests, setGuests] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [tables, setTables] = useState([]);
  const [rules, setRules] = useState([]);
  const [mobileSelectedTable, setMobileSelectedTable] = useState(null);
  const [mobileZoom, setMobileZoom] = useState(0.35);

  useEffect(() => {
    if (!activeWedding) return;
    const unsub1 = subscribeToGuests(activeWedding.id, setGuests);
    const unsub2 = subscribeToEvents(activeWedding.id, (evts) => {
      setEvents(evts);
      if (!selectedEventId && evts.length > 0) setSelectedEventId(evts[0].id);
    });
    return () => { unsub1(); unsub2(); };
  }, [activeWedding]);

  useEffect(() => {
    if (!activeWedding || !selectedEventId) return;
    return subscribeToSeating(activeWedding.id, selectedEventId, (data) => {
      setTables(data.tables || []);
      setRules(data.rules || []);
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

  if (!activeWedding) return null;

  // Calculate canvas bounds
  const canvasBounds = useMemo(() => {
    if (tables.length === 0) return { width: 600, height: 400 };
    let maxX = 0, maxY = 0;
    tables.forEach((t) => {
      maxX = Math.max(maxX, (t.x || 0) + (t.width || 120) + 100);
      maxY = Math.max(maxY, (t.y || 0) + (t.height || 120) + 80);
    });
    return { width: Math.max(600, maxX), height: Math.max(400, maxY) };
  }, [tables]);

  return (
    <div className="flex flex-col h-[calc(100dvh-7.5rem)] overflow-hidden -mx-4 -my-5">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <select
            value={selectedEventId || ''}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs max-w-[120px]"
            aria-label="Select event"
          >
            {events.map((evt) => <option key={evt.id} value={evt.id}>{evt.name}</option>)}
          </select>
          <span className="text-xs text-gray-500 truncate">
            {tables.length} tables &bull; {assignedGuestIds.size}/{guests.length}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setMobileZoom((z) => Math.max(0.15, z - 0.05))}
            className="size-7 rounded-full bg-gray-100 text-gray-600 text-sm font-bold"
            aria-label="Zoom out"
          >-</button>
          <button
            onClick={() => setMobileZoom((z) => Math.min(0.6, z + 0.05))}
            className="size-7 rounded-full bg-gray-100 text-gray-600 text-sm font-bold"
            aria-label="Zoom in"
          >+</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-50 relative">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <p className="text-gray-400 text-sm mb-1">No tables yet</p>
            <p className="text-gray-400 text-xs">Open this page on desktop to add tables and arrange seating.</p>
          </div>
        ) : (
          <div
            style={{
              width: canvasBounds.width * mobileZoom,
              height: canvasBounds.height * mobileZoom,
              position: 'relative',
              transform: `scale(${mobileZoom})`,
              transformOrigin: 'top left',
              minWidth: canvasBounds.width,
              minHeight: canvasBounds.height,
            }}
          >
            {tables.map((table) => {
              const isSelected = mobileSelectedTable?.id === table.id;
              const assigned = (table.assignedGuests || []).length;
              const isFull = assigned >= table.capacity;
              const isOver = assigned > table.capacity;
              const shapeClass = table.shape === 'round' || table.shape === 'oval' || table.shape === 'cocktail'
                ? 'rounded-full' : 'rounded-xl';
              return (
                <div
                  key={table.id}
                  onClick={() => setMobileSelectedTable(isSelected ? null : table)}
                  style={{
                    position: 'absolute',
                    left: table.x,
                    top: table.y,
                    width: (table.width || 120) + 80,
                    height: (table.height || 120) + 60,
                    cursor: 'pointer',
                    zIndex: isSelected ? 10 : 1,
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 40, top: 30,
                      width: table.width || 120,
                      height: table.height || 120,
                      transform: table.rotation ? `rotate(${table.rotation}deg)` : undefined,
                    }}
                    className={`border-2 flex flex-col items-center justify-center ${shapeClass} ${
                      isOver ? 'border-red-400 bg-red-50' : isFull ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-white'
                    }`}
                  >
                    <span className="text-xs font-semibold text-gray-700 leading-tight">{table.name}</span>
                    <span className={`text-[10px] font-bold mt-0.5 ${isOver ? 'text-red-600' : 'text-gray-500'}`}>
                      {assigned}/{table.capacity}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="absolute inset-0 rounded-xl ring-4 ring-wine-400/50 pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Table detail bottom sheet */}
      {mobileSelectedTable && (
        <div className="border-t border-gray-200 bg-white max-h-[35dvh] overflow-auto animate-slide-up shrink-0">
          <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{mobileSelectedTable.name}</h3>
              <p className="text-xs text-gray-500">
                {(mobileSelectedTable.assignedGuests || []).length}/{mobileSelectedTable.capacity} seats filled
                {mobileSelectedTable.shape && ` \u2022 ${mobileSelectedTable.shape}`}
              </p>
            </div>
            <button
              onClick={() => setMobileSelectedTable(null)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >&times;</button>
          </div>
          <div className="px-4 py-2">
            {(mobileSelectedTable.assignedGuests || []).length === 0 ? (
              <p className="text-sm text-gray-400 py-3 text-center">No guests assigned yet</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {(mobileSelectedTable.assignedGuests || []).map((gId) => {
                  const g = guests.find((gu) => gu.id === gId);
                  if (!g) return null;
                  return (
                    <li key={gId} className="py-2 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{g.firstName} {g.lastName}</p>
                        {g.familyName && <p className="text-xs text-gray-500">{g.familyName}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        {g.dietary && g.dietary !== 'unspecified' && (
                          <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">{g.dietary}</span>
                        )}
                        {g.tags?.includes('elderly') && <span className="text-xs">👴</span>}
                        {g.tags?.includes('child') && <span className="text-xs">👶</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-3 py-2 border-t border-gray-200 bg-white flex items-center justify-between text-xs text-gray-600 shrink-0">
        <span>{unassignedGuests.length} unassigned</span>
        {ruleEvaluation.violationCount > 0 && (
          <span className="text-amber-700">Warning: {ruleEvaluation.violationCount} violations</span>
        )}
      </div>
    </div>
  );
}
