import { jsPDF } from 'jspdf';

// Convert a #rrggbb hex string to an [r, g, b] array for jsPDF color setters.
// Falls back to a soft charcoal for malformed input.
function hexToRgb(hex, fallback = [40, 40, 40]) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex || '')) return fallback;
  const n = hex.slice(1);
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

// Map a website theme's display font to one of jsPDF's built-in faces. All of
// the wedding display fonts are serifs, so serif → 'times', otherwise helvetica.
function themeFonts(theme) {
  const family = (theme?.fontFamily || '').toLowerCase();
  const serif = family.includes('serif') || family.includes('georgia') || !family;
  return { name: serif ? 'times' : 'helvetica', body: 'helvetica' };
}

// ─── Place Cards PDF ────────────────────────────────────────────────────────
// Tent-fold place cards: fold the sheet along the dashed center crease so the
// card stands like a ∧. The lower half prints right-side-up (front face) and the
// upper half prints upside-down so it reads correctly once folded over the back.
// Layout: 2 columns × 5 rows = 10 cards per page. Colors + fonts follow the
// wedding website theme when one is supplied.

export function generatePlaceCardsPDF(guests, options = {}) {
  const {
    showTable = true,
    showDietary = true,
    showFamily = false,
    paperSize = 'letter',  // 'letter' | 'a4'
    theme = null,          // resolved website theme (websiteThemes.resolveWebsiteTheme)
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: paperSize });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const cols = 2;
  const rows = 5;
  const gap = 4;
  const cardW = (pageW - margin * 2 - gap * (cols - 1)) / cols;
  const cardH = (pageH - margin * 2 - gap * (rows - 1)) / rows;

  const fonts = themeFonts(theme);
  const nameColor = hexToRgb(theme?.primary || theme?.text, [45, 45, 45]);
  const subColor = hexToRgb(theme?.muted, [120, 120, 120]);
  const borderColor = hexToRgb(theme?.accent, [190, 160, 130]);
  const nameSize = 15;
  const subSize = 8.5;

  const buildSub = (guest) => {
    const parts = [];
    if (showTable && guest.tableName) parts.push(`Table ${guest.tableName}`);
    if (showDietary && guest.dietary && guest.dietary !== 'non-veg') {
      const labels = { vegetarian: 'Vegetarian', vegan: 'Vegan', jain: 'Jain' };
      parts.push(labels[guest.dietary] || guest.dietary);
    }
    if (showFamily && guest.familyName) parts.push(guest.familyName);
    return parts.join('   ·   ');
  };

  // Approx. vertical nudge (mm) to visually center a single line of cap-height
  // text on its anchor. 1pt ≈ 0.3528mm; cap height ≈ 0.7em, half of that centers.
  const nameNudge = nameSize * 0.3528 * 0.35;
  const subNudge = subSize * 0.3528 * 0.35;

  guests.forEach((guest, i) => {
    if (i > 0 && i % (cols * rows) === 0) doc.addPage();

    const posInPage = i % (cols * rows);
    const col = posInPage % cols;
    const row = Math.floor(posInPage / cols);
    const x = margin + col * (cardW + gap);
    const y = margin + row * (cardH + gap);

    const centerX = x + cardW / 2;
    const yMid = y + cardH / 2;
    const fullName = `${guest.firstName || ''} ${guest.lastName || ''}`.trim();
    const sub = buildSub(guest);

    // Card border
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(x, y, cardW, cardH, 2.5, 2.5);

    // Center fold crease (dashed, subtle)
    doc.setLineDashPattern([1.2, 1.2], 0);
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.2);
    doc.line(x + 4, yMid, x + cardW - 4, yMid);
    doc.setLineDashPattern([], 0);

    // ── Bottom half: front face, right-side up ──
    const frontNameY = y + cardH * 0.70;
    doc.setFont(fonts.name, 'bold');
    doc.setFontSize(nameSize);
    doc.setTextColor(...nameColor);
    doc.text(fullName, centerX, frontNameY + nameNudge, { align: 'center' });

    if (sub) {
      doc.setFont(fonts.body, 'normal');
      doc.setFontSize(subSize);
      doc.setTextColor(...subColor);
      doc.text(sub, centerX, frontNameY + 6 + subNudge, { align: 'center' });
    }
    // Small accent rule under the front name
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(centerX - 10, frontNameY - 6, centerX + 10, frontNameY - 6);

    // ── Top half: back face, upside down (angle 180) ──
    const backNameY = y + cardH * 0.30;
    doc.setFont(fonts.name, 'bold');
    doc.setFontSize(nameSize);
    doc.setTextColor(...nameColor);
    doc.text(fullName, centerX, backNameY - nameNudge, { align: 'center', angle: 180 });

    if (sub) {
      doc.setFont(fonts.body, 'normal');
      doc.setFontSize(subSize);
      doc.setTextColor(...subColor);
      doc.text(sub, centerX, backNameY - 6 - subNudge, { align: 'center', angle: 180 });
    }
    doc.setDrawColor(...borderColor);
    doc.setLineWidth(0.3);
    doc.line(centerX - 10, backNameY + 6, centerX + 10, backNameY + 6);
  });

  return doc;
}

// ─── Table Assignment Sheet ─────────────────────────────────────────────────
// One page per table listing all guests

export function generateTableAssignmentPDF(tables, guests, options = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  appendTableAssignments(doc, tables, guests, options);
  return doc;
}

export function generateSeatingChartPDF(tables, zones, guests, options = {}) {
  const { eventName = '', weddingName = '' } = options;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  const chartTop = 28;
  const chartW = pageW - margin * 2;
  const chartH = pageH - chartTop - margin;
  const items = [...tables, ...zones];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Seating Chart', margin, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  const subtitle = [weddingName, eventName].filter(Boolean).join(' - ');
  if (subtitle) doc.text(subtitle, margin, 19);
  doc.text(`${tables.length} tables - ${guests.length} guests`, pageW - margin, 13, { align: 'right' });

  doc.setDrawColor(220, 220, 220);
  doc.setFillColor(252, 251, 249);
  doc.roundedRect(margin, chartTop, chartW, chartH, 2, 2, 'FD');

  if (items.length > 0) {
    const minX = Math.min(...items.map((item) => item.x || 0));
    const minY = Math.min(...items.map((item) => item.y || 0));
    const maxX = Math.max(...items.map((item) => (item.x || 0) + (item.width || 120)));
    const maxY = Math.max(...items.map((item) => (item.y || 0) + (item.height || 120)));
    const contentW = Math.max(maxX - minX, 1);
    const contentH = Math.max(maxY - minY, 1);
    const innerPadding = 8;
    const scale = Math.min(
      (chartW - innerPadding * 2) / contentW,
      (chartH - innerPadding * 2) / contentH,
    );
    const offsetX = margin + (chartW - contentW * scale) / 2;
    const offsetY = chartTop + (chartH - contentH * scale) / 2;
    const mapX = (value) => offsetX + ((value || 0) - minX) * scale;
    const mapY = (value) => offsetY + ((value || 0) - minY) * scale;

    zones.forEach((zone) => {
      const x = mapX(zone.x);
      const y = mapY(zone.y);
      const width = Math.max((zone.width || 120) * scale, 8);
      const height = Math.max((zone.height || 80) * scale, 6);

      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.setDrawColor(170, 155, 160);
      doc.setFillColor(246, 240, 242);
      doc.roundedRect(x, y, width, height, 1.5, 1.5, 'FD');
      doc.setLineDashPattern([], 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(Math.max(6, Math.min(9, height * 0.18)));
      doc.setTextColor(105, 90, 95);
      doc.text(zone.label || 'Zone', x + width / 2, y + height / 2 + 1, {
        align: 'center',
        maxWidth: Math.max(width - 3, 4),
      });
    });

    tables.forEach((table) => {
      const x = mapX(table.x);
      const y = mapY(table.y);
      const width = Math.max((table.width || 120) * scale, 9);
      const height = Math.max((table.height || 120) * scale, 7);
      const assigned = (table.assignedGuests || []).length;
      const isOver = assigned > table.capacity;

      doc.setDrawColor(...(isOver ? [190, 75, 75] : [122, 28, 62]));
      doc.setFillColor(...(isOver ? [255, 240, 240] : [255, 249, 251]));
      if (['round', 'oval', 'cocktail'].includes(table.shape)) {
        doc.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 'FD');
      } else {
        doc.roundedRect(x, y, width, height, 1.5, 1.5, 'FD');
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(Math.max(5.5, Math.min(8, height * 0.18)));
      doc.setTextColor(55, 45, 48);
      const labelY = y + height / 2 - 0.5;
      doc.text(table.name || 'Table', x + width / 2, labelY, {
        align: 'center',
        maxWidth: Math.max(width - 3, 4),
      });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(Math.max(5, Math.min(7, height * 0.15)));
      doc.setTextColor(isOver ? 170 : 110, isOver ? 50 : 95, isOver ? 50 : 100);
      doc.text(`${assigned}/${table.capacity}`, x + width / 2, labelY + 3.5, { align: 'center' });
    });
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(150, 150, 150);
    doc.text('No seating layout has been created yet.', pageW / 2, pageH / 2, { align: 'center' });
  }

  appendTableAssignments(doc, tables, guests, options, true);
  return doc;
}

function appendTableAssignments(doc, tables, guests, options = {}, addFirstPage = false) {
  const { eventName = '', showDietary = true } = options;
  if (addFirstPage) doc.addPage('letter', 'portrait');

  const firstAssignmentPage = doc.internal.getNumberOfPages();
  const assignedIds = new Set(tables.flatMap((table) => table.assignedGuests || []));
  const unassignedGuests = guests.filter((guest) => !assignedIds.has(guest.id));
  const groups = [
    ...tables.map((table) => ({
      ...table,
      resolvedGuests: (table.assignedGuests || [])
        .map((id) => guests.find((guest) => guest.id === id))
        .filter(Boolean),
    })),
    ...(unassignedGuests.length > 0 ? [{
      id: '__unassigned',
      name: 'Unassigned guests',
      capacity: null,
      resolvedGuests: unassignedGuests,
    }] : []),
  ];

  let pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = margin;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(40, 40, 40);
  doc.text('Table Assignments', margin, y);
  y += 5;

  if (eventName) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(120, 120, 120);
    doc.text(eventName, margin, y);
    y += 3;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleDateString()}`, margin, y);
  y += 8;

  groups.forEach((table) => {
    const tableGuests = table.resolvedGuests;

    const blockHeight = 12 + tableGuests.length * 6 + 5;

    // New page if needed
    if (y + blockHeight > 260) {
      doc.addPage('letter', 'portrait');
      pageW = doc.internal.pageSize.getWidth();
      y = margin;
    }

    // Table header
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(margin, y, pageW - margin * 2, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(40, 40, 40);
    doc.text(`${table.name}`, margin + 3, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    const countLabel = table.capacity
      ? `${tableGuests.length}/${table.capacity} seats`
      : `${tableGuests.length} guests`;
    doc.text(countLabel, pageW - margin - 3, y + 5.5, { align: 'right' });
    y += 10;

    // Guest rows
    tableGuests.forEach((g, i) => {
      const rowY = y + i * 6;
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.setFont('helvetica', 'normal');
      doc.text(`${i + 1}.  ${g.firstName} ${g.lastName}`, margin + 5, rowY + 3.5);

      if (g.familyName) {
        doc.setTextColor(150, 150, 150);
        doc.text(g.familyName, margin + 80, rowY + 3.5);
      }

      const dietary = g.dietaryPreference || g.dietary;
      if (showDietary && dietary && dietary !== 'non-veg') {
        const labels = { vegetarian: 'V', vegan: 'VG', jain: 'J' };
        doc.setTextColor(180, 130, 80);
        doc.text(labels[dietary] || '', pageW - margin - 5, rowY + 3.5, { align: 'right' });
      }
    });

    y += tableGuests.length * 6 + 5;
  });

  // Page numbers
  const lastAssignmentPage = doc.internal.getNumberOfPages();
  const assignmentPageCount = lastAssignmentPage - firstAssignmentPage + 1;
  for (let i = firstAssignmentPage; i <= lastAssignmentPage; i++) {
    doc.setPage(i);
    const currentPageW = doc.internal.pageSize.getWidth();
    const currentPageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text(
      `Assignments page ${i - firstAssignmentPage + 1} of ${assignmentPageCount}`,
      currentPageW / 2,
      currentPageH - 7,
      { align: 'center' },
    );
  }
}

// ─── Guest List PDF ─────────────────────────────────────────────────────────
// Full alphabetical guest list with RSVP status per event

export function generateGuestListPDF(guests, events, options = {}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 12;
  let y = margin;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Guest List', margin, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${guests.length} guests · ${events.length} events · ${new Date().toLocaleDateString()}`, margin, y + 10);
  y += 16;

  // Header row — column widths tuned to fit letter *portrait* width (~192mm usable)
  const colWidths = {
    num: 7,
    name: 42,
    family: 26,
    side: 10,
    dietary: 14,
    phone: 26,
  };
  const eventColW = Math.min(18, (pageW - margin * 2 - Object.values(colWidths).reduce((a, b) => a + b, 0)) / Math.max(events.length, 1));

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageW - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);

  let hx = margin + 2;
  doc.text('#', hx, y + 5); hx += colWidths.num;
  doc.text('Name', hx, y + 5); hx += colWidths.name;
  doc.text('Family', hx, y + 5); hx += colWidths.family;
  doc.text('Side', hx, y + 5); hx += colWidths.side;
  doc.text('Diet', hx, y + 5); hx += colWidths.dietary;
  doc.text('Phone', hx, y + 5); hx += colWidths.phone;
  events.forEach((evt) => {
    doc.text((evt.name || '').substring(0, 8), hx, y + 5);
    hx += eventColW;
  });
  y += 9;

  // Sort guests alphabetically
  const sorted = [...guests].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`)
  );

  sorted.forEach((g, i) => {
    if (y > pageH - 15) {
      doc.addPage();
      y = margin;
    }

    if (i % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y - 1, pageW - margin * 2, 5.5, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 60);

    let rx = margin + 2;
    doc.text(`${i + 1}`, rx, y + 3); rx += colWidths.num;
    doc.text(`${g.firstName} ${g.lastName}`, rx, y + 3); rx += colWidths.name;
    doc.text(g.familyName || '', rx, y + 3); rx += colWidths.family;
    doc.text(g.side === 'bride' ? 'B' : 'G', rx, y + 3); rx += colWidths.side;
    const dietLabels = { vegetarian: 'Veg', vegan: 'VG', jain: 'Jain', 'non-veg': 'NV' };
    doc.text(dietLabels[g.dietary] || '', rx, y + 3); rx += colWidths.dietary;
    doc.text(g.phone || '', rx, y + 3); rx += colWidths.phone;

    events.forEach((evt) => {
      const status = (g.rsvpStatus || {})[evt.id];
      if (status === 'accepted') { doc.setTextColor(34, 139, 34); doc.text('✓', rx + 4, y + 3); }
      else if (status === 'declined') { doc.setTextColor(200, 50, 50); doc.text('✗', rx + 4, y + 3); }
      else { doc.setTextColor(180, 180, 180); doc.text('—', rx + 4, y + 3); }
      doc.setTextColor(60, 60, 60);
      rx += eventColW;
    });

    y += 5.5;
  });

  return doc;
}
