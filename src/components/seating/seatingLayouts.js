import { Grid3X3, CircleDot, Square, Wine, Cake, Gift, Wand2 } from 'lucide-react';

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
 * Standard reception layout (matches the classic banquet template):
 *   - Head table at the TOP center
 *   - Gifts + Cake stations just below the head table
 *   - A large SQUARE dance floor in the center
 *   - DJ booth at the BOTTOM center (opposite the head table)
 *   - Round tables split into two equal blocks flanking the dance floor,
 *     two columns per side, labelled A, B, C, D, ... across each row.
 */
export function generateReceptionLayout(totalTables, venueWidth = 1400) {
  const regularTables = Math.max(2, totalTables - 1);
  const rows = Math.ceil(regularTables / 4); // 4 rounds per row (2 left, 2 right)
  const centerX = venueWidth / 2;

  const rowStartY = 250;
  const rowSpacing = 180;
  const columnHeight = rows * rowSpacing;

  // Two columns per side, leaving a central aisle for the dance floor.
  const leftCols = [100, 320];
  const rightCols = [venueWidth - 420, venueWidth - 200];

  const tables = [];

  // Head table — top center.
  tables.push({
    id: 'table-head',
    name: 'Head Table',
    x: centerX - 170,
    y: 60,
    width: 340,
    height: 70,
    capacity: 10,
    shape: 'head-table',
    isHeadTable: true,
    label: 'Bride & Groom',
  });

  // Round tables, filled row by row: [left-1, left-2, right-1, right-2].
  const colOrder = [leftCols[0], leftCols[1], rightCols[0], rightCols[1]];
  for (let i = 0; i < regularTables; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    tables.push({
      id: `table-${i + 1}`,
      name: `Table ${i + 1}`,
      x: colOrder[col],
      y: rowStartY + row * rowSpacing,
      width: 120,
      height: 120,
      capacity: 8,
      shape: 'round',
      eventType: 'reception',
    });
  }

  // Central square dance floor, vertically centered against the table columns.
  const danceSize = Math.min(360, Math.max(300, columnHeight - 260));
  const danceFloor = {
    x: centerX - danceSize / 2,
    y: rowStartY + Math.max(120, (columnHeight - danceSize) / 2),
    width: danceSize,
    height: danceSize,
    type: 'dance-floor',
    label: 'Dance Floor',
  };

  const gifts = {
    x: centerX - 110,
    y: 150,
    width: 90,
    height: 70,
    type: 'gifts',
    label: 'Gifts',
  };
  const cake = {
    x: centerX + 20,
    y: 150,
    width: 90,
    height: 70,
    type: 'cake',
    label: 'Cake',
  };

  // DJ booth + stage — placed next to each other on the entrance-facing side
  // of the dance floor (the bottom, opposite the head table). Performers face
  // the crowd and the entrance doors.
  const deckY = danceFloor.y + danceFloor.height + 30;
  const stage = {
    x: centerX - 210,
    y: deckY,
    width: 240,
    height: 90,
    type: 'stage',
    label: 'Stage',
  };
  const dj = {
    x: centerX + 50,
    y: deckY,
    width: 160,
    height: 90,
    type: 'dj',
    label: 'DJ Booth',
  };
  const entrance = {
    x: centerX - 70,
    y: deckY + 130,
    width: 140,
    height: 50,
    type: 'entrance',
    label: 'Entrance',
  };

  return { tables, zones: [danceFloor, gifts, cake, stage, dj, entrance] };
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


// ─── Venue layout presets ───────────────────────────────────────────────────
// Each table element renders at (table.width + 80) x (table.height + 60) due to
// chip positioning padding. Spacing must account for this.

export const VENUE_LAYOUTS = (() => {
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
