export function getMobileLayoutBounds(tables = [], zones = []) {
  const items = [...tables, ...zones];
  if (items.length === 0) return { width: 600, height: 400 };

  let maxX = 600;
  let maxY = 400;
  items.forEach((item) => {
    maxX = Math.max(maxX, (item.x || 0) + (item.width || 120) + 100);
    maxY = Math.max(maxY, (item.y || 0) + (item.height || 120) + 80);
  });

  return { width: maxX, height: maxY };
}

export function assignGuestWithoutDragging(tables, guestId, targetTableId) {
  return tables.map((table) => {
    const assignedGuests = (table.assignedGuests || []).filter((id) => id !== guestId);
    if (targetTableId && table.id === targetTableId) {
      return { ...table, assignedGuests: [...assignedGuests, guestId] };
    }
    return { ...table, assignedGuests };
  });
}

export function getNextLockedTablePosition(tables = [], zones = []) {
  const items = [...tables, ...zones];
  if (items.length === 0) return { x: 80, y: 80 };

  const lowestEdge = Math.max(
    ...items.map((item) => (item.y || 0) + (item.height || 120)),
  );
  return { x: 80, y: lowestEdge + 100 };
}
