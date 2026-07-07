/**
 * Helpers for distinguishing multi-seat tables from individual ceremony seats.
 *
 * Ceremony/mandap arc layouts place each guest position as its own single-seat
 * "table" (capacity 1). Those are decorative seat positions, not assignable
 * tables. Guests may only be assigned to real multi-seat tables, so individual
 * seats are treated as non-droppable everywhere assignment happens.
 */

/**
 * True when a table represents a single individual seat (e.g. a mandap arc
 * chair) rather than a multi-seat table guests can be assigned to.
 * @param {{ capacity?: number }} table
 * @returns {boolean}
 */
export function isIndividualSeat(table) {
  if (!table) return false;
  const capacity = Number(table.capacity);
  return Number.isFinite(capacity) && capacity <= 1;
}
