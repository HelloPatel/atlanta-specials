/**
 * Advanced seating layout generator for Indian weddings.
 * Includes stagger effect, Indian wedding-specific layouts, and optimal positioning.
 */

/**
 * Generate staggered table positions with offset rows
 * Creates a natural, organic look instead of grid alignment
 */
export function generateStaggeredLayout(tableCount, startX = 100, startY = 100, rowLength = 4) {
  const positions = [];
  const tableSpacing = 160;
  const rowSpacing = 180;
  const staggerAmount = 80; // Offset for odd rows

  for (let i = 0; i < tableCount; i++) {
    const row = Math.floor(i / rowLength);
    const col = i % rowLength;
    
    const x = startX + (col * tableSpacing) + (row % 2 === 1 ? staggerAmount : 0);
    const y = startY + (row * rowSpacing);
    
    positions.push({ x, y });
  }

  return positions;
}

/**
 * Indian wedding ballroom layout with traditional seating arrangements
 * Includes mandap/stage area, bride family, groom family seating, dance floor
 */
export function generateIndianWeddingLayout(totalTables, venueWidth = 1000, venueHeight = 800) {
  const layout = {
    mandap: {
      x: venueWidth / 2 - 120,
      y: 80,
      width: 240,
      height: 120,
      type: 'stage',
      label: 'Mandap/Stage',
    },
    danceFloor: {
      x: venueWidth / 2 - 150,
      y: venueHeight - 300,
      width: 300,
      height: 200,
      type: 'dance-floor',
      label: 'Dance Floor',
    },
    bar: {
      x: 50,
      y: venueHeight - 150,
      width: 120,
      height: 100,
      type: 'bar',
      label: 'Bar',
    },
    cocktail: {
      x: venueWidth - 170,
      y: venueHeight - 150,
      width: 120,
      height: 100,
      type: 'cocktail-area',
      label: 'Cocktail Area',
    },
  };

  // Divide tables into two groups: bride family (left) and groom family (right)
  const brideTableCount = Math.ceil(totalTables / 2);
  const groomTableCount = totalTables - brideTableCount;

  const tables = [];
  let tableIdx = 1;

  // Bride family tables (left side)
  const bridePositions = generateStaggeredLayout(
    brideTableCount,
    80,
    250,
    Math.ceil(brideTableCount / 3)
  );

  for (const pos of bridePositions) {
    tables.push({
      id: `table-${tableIdx}`,
      name: `Table ${tableIdx}`,
      x: Math.min(pos.x, venueWidth / 2 - 200),
      y: pos.y,
      width: 120,
      height: 120,
      capacity: 10,
      shape: 'round',
      side: 'bride',
      label: `Bride Family T${tableIdx}`,
    });
    tableIdx++;
  }

  // Groom family tables (right side)
  const groomPositions = generateStaggeredLayout(
    groomTableCount,
    venueWidth / 2 + 100,
    250,
    Math.ceil(groomTableCount / 3)
  );

  for (const pos of groomPositions) {
    tables.push({
      id: `table-${tableIdx}`,
      name: `Table ${tableIdx}`,
      x: Math.max(pos.x, venueWidth / 2 + 100),
      y: pos.y,
      width: 120,
      height: 120,
      capacity: 10,
      shape: 'round',
      side: 'groom',
      label: `Groom Family T${tableIdx}`,
    });
    tableIdx++;
  }

  return { tables, zones: [layout.mandap, layout.danceFloor, layout.bar, layout.cocktail] };
}

/**
 * Mehendi/Sangeet event layout - more casual, multiple focal points
 */
export function generateMehendiLayout(totalTables, venueWidth = 1000, venueHeight = 800) {
  const layout = {
    stage: {
      x: venueWidth / 2 - 150,
      y: 60,
      width: 300,
      height: 100,
      type: 'stage',
      label: 'Performance Stage',
    },
    danceFloor: {
      x: 50,
      y: venueHeight / 2 - 100,
      width: 200,
      height: 200,
      type: 'dance-floor',
      label: 'Dance Area',
    },
    seating: {
      x: venueWidth / 2 + 100,
      y: venueHeight / 2 - 100,
      width: 300,
      height: 200,
      type: 'cocktail-area',
      label: 'Cocktail Seating',
    },
  };

  const positions = generateStaggeredLayout(totalTables, 50, 250, 5);
  const tables = positions.map((pos, idx) => ({
    id: `table-${idx + 1}`,
    name: `Table ${idx + 1}`,
    x: pos.x,
    y: pos.y,
    width: 100,
    height: 100,
    capacity: 8,
    shape: 'cocktail',
    eventType: 'mehendi',
  }));

  return { tables, zones: [layout.stage, layout.danceFloor, layout.seating] };
}

/**
 * Reception layout - formal, multiple head tables
 */
export function generateReceptionLayout(totalTables, venueWidth = 1000, venueHeight = 800) {
  const layout = {
    headTable: {
      x: venueWidth / 2 - 150,
      y: 80,
      width: 300,
      height: 80,
      type: 'stage',
      label: 'Head Table (Bride & Groom)',
    },
    danceFloor: {
      x: venueWidth / 2 - 120,
      y: venueHeight - 280,
      width: 240,
      height: 180,
      type: 'dance-floor',
      label: 'Dance Floor',
    },
  };

  // Arrange regular tables in a circular pattern around head table
  const regularTables = totalTables - 1; // Subtract head table
  const positions = generateStaggeredLayout(regularTables, 100, 220, 4);

  const tables = [];

  // Head table
  tables.push({
    id: 'table-head',
    name: 'Head Table',
    x: layout.headTable.x,
    y: layout.headTable.y,
    width: 300,
    height: 80,
    capacity: 12,
    shape: 'head-table',
    isHeadTable: true,
    label: 'Bride & Groom',
  });

  // Regular tables
  for (let i = 0; i < regularTables; i++) {
    tables.push({
      id: `table-${i + 1}`,
      name: `Table ${i + 1}`,
      x: positions[i].x,
      y: positions[i].y,
      width: 120,
      height: 120,
      capacity: 10,
      shape: 'round',
      eventType: 'reception',
    });
  }

  return { tables, zones: [layout.headTable, layout.danceFloor] };
}

/**
 * Optimize table positions to minimize overlaps while preserving layout intent
 */
export function optimizeTablePositions(tables, venueWidth = 1000, venueHeight = 800, padding = 150) {
  const buffer = 30; // Minimum distance between tables
  const optimized = [...tables];

  // Sort by y-coordinate to preserve rows
  optimized.sort((a, b) => a.y - b.y);

  // Simple collision detection and adjustment
  for (let i = 0; i < optimized.length; i++) {
    for (let j = i + 1; j < optimized.length; j++) {
      const t1 = optimized[i];
      const t2 = optimized[j];

      const dist = Math.hypot(
        t2.x - t1.x,
        t2.y - t1.y
      );

      const minDist = (Math.max(t1.width, t1.height) + Math.max(t2.width, t2.height)) / 2 + buffer;

      if (dist < minDist) {
        // Push table 2 away from table 1
        const angle = Math.atan2(t2.y - t1.y, t2.x - t1.x);
        const force = minDist - dist;
        t2.x += Math.cos(angle) * (force / 2);
        t2.y += Math.sin(angle) * (force / 2);

        // Keep within bounds
        t2.x = Math.max(padding, Math.min(venueWidth - padding, t2.x));
        t2.y = Math.max(padding, Math.min(venueHeight - padding, t2.y));
      }
    }
  }

  return optimized;
}

/**
 * Generate layout suggestions for different venue sizes
 */
export function getLayoutSuggestions(guestCount, venueSize = 'medium') {
  const configurations = {
    small: {
      tablesPerRow: 3,
      capacity: 100,
      venueWidth: 600,
      venueHeight: 500,
    },
    medium: {
      tablesPerRow: 4,
      capacity: 400,
      venueWidth: 1000,
      venueHeight: 800,
    },
    large: {
      tablesPerRow: 5,
      capacity: 1000,
      venueWidth: 1400,
      venueHeight: 1000,
    },
  };

  const config = configurations[venueSize] || configurations.medium;
  const averageCapacity = 10;
  const estimatedTables = Math.ceil(guestCount / averageCapacity);

  return {
    config,
    estimatedTables,
    layout: generateIndianWeddingLayout(estimatedTables, config.venueWidth, config.venueHeight),
  };
}
