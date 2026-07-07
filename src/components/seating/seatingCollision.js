/**
 * Axis-aligned collision helpers for the seating canvas.
 *
 * Tables and zones are stored with a top-left `x`/`y` in canvas coordinates.
 * A table's visible shape is offset by (40, 30) inside its wrapper (see
 * Table.jsx), so its collision box is computed from that offset. Zones use
 * their raw `x`/`y`.
 */

const GAP = 16; // minimum breathing room kept between any two items

export function itemBox(item, kind) {
  if (kind === 'table') {
    const left = (item.x || 0) + 40;
    const top = (item.y || 0) + 30;
    return { left, top, right: left + (item.width || 100), bottom: top + (item.height || 100) };
  }
  const left = item.x || 0;
  const top = item.y || 0;
  return { left, top, right: left + (item.width || 100), bottom: top + (item.height || 100) };
}

function storedFromBox(left, top, kind) {
  if (kind === 'table') return { x: left - 40, y: top - 30 };
  return { x: left, y: top };
}

/**
 * Given a moving item's kind/size and a proposed top-left stored position,
 * push it out of any overlapping obstacle boxes and return an adjusted
 * `{ x, y }` (still in stored coordinates). Resolves along the axis of least
 * penetration so dragged items slide against their neighbours instead of
 * overlapping them.
 */
export function resolveNoOverlap(kind, width, height, proposedX, proposedY, obstacles) {
  const box = itemBox({ x: proposedX, y: proposedY, width, height }, kind);

  for (let pass = 0; pass < 4; pass++) {
    let moved = false;
    for (const ob of obstacles) {
      const overlapX = Math.min(box.right, ob.right + GAP) - Math.max(box.left, ob.left - GAP);
      const overlapY = Math.min(box.bottom, ob.bottom + GAP) - Math.max(box.top, ob.top - GAP);
      if (overlapX > 0 && overlapY > 0) {
        if (overlapX < overlapY) {
          const dir = (box.left + box.right) / 2 < (ob.left + ob.right) / 2 ? -1 : 1;
          box.left += dir * overlapX;
          box.right += dir * overlapX;
        } else {
          const dir = (box.top + box.bottom) / 2 < (ob.top + ob.bottom) / 2 ? -1 : 1;
          box.top += dir * overlapY;
          box.bottom += dir * overlapY;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }

  return storedFromBox(box.left, box.top, kind);
}
