import { jsPDF } from 'jspdf';

// ─── Place Cards PDF ────────────────────────────────────────────────────────
// Generates printable place cards (tent-fold style) on letter/A4 paper
// Layout: 2 columns × 5 rows = 10 cards per page

export function generatePlaceCardsPDF(guests, options = {}) {
  const {
    eventName = '',
    showTable = true,
    showDietary = true,
    showFamily = false,
    cardStyle = 'elegant', // 'elegant' | 'modern' | 'minimal'
    paperSize = 'letter',  // 'letter' | 'a4'
  } = options;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: paperSize });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 10;
  const cols = 2;
  const rows = 5;
  const cardW = (pageW - margin * 2 - 5) / cols;
  const cardH = (pageH - margin * 2 - 4 * 2) / rows;
  const gap = 2;

  const styles = {
    elegant: { nameSize: 14, subSize: 8, nameFontStyle: 'bold', borderColor: [180, 130, 100] },
    modern: { nameSize: 13, subSize: 8, nameFontStyle: 'bold', borderColor: [100, 100, 100] },
    minimal: { nameSize: 12, subSize: 7, nameFontStyle: 'normal', borderColor: [200, 200, 200] },
  };
  const style = styles[cardStyle] || styles.elegant;

  let cardIndex = 0;

  guests.forEach((guest) => {
    if (cardIndex > 0 && cardIndex % (cols * rows) === 0) {
      doc.addPage();
    }

    const posInPage = cardIndex % (cols * rows);
    const col = posInPage % cols;
    const row = Math.floor(posInPage / cols);
    const x = margin + col * (cardW + gap);
    const y = margin + row * (cardH + gap);

    // Card border
    doc.setDrawColor(...style.borderColor);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 2, 2);

    // Fold line (dashed)
    doc.setLineDashPattern([1, 1], 0);
    doc.setDrawColor(200, 200, 200);
    doc.line(x + 3, y + cardH / 2, x + cardW - 3, y + cardH / 2);
    doc.setLineDashPattern([], 0);

    // Guest name (centered on top half)
    const centerX = x + cardW / 2;
    const topCenterY = y + cardH / 4;

    doc.setFont('helvetica', style.nameFontStyle);
    doc.setFontSize(style.nameSize);
    doc.setTextColor(40, 40, 40);
    doc.text(`${guest.firstName} ${guest.lastName}`, centerX, topCenterY, { align: 'center' });

    // Subtitle line(s)
    let subY = topCenterY + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(style.subSize);
    doc.setTextColor(120, 120, 120);

    const subParts = [];
    if (showTable && guest.tableName) subParts.push(`Table: ${guest.tableName}`);
    if (showDietary && guest.dietary && guest.dietary !== 'non-veg') {
      const labels = { vegetarian: 'Veg', vegan: 'Vegan', jain: 'Jain' };
      subParts.push(labels[guest.dietary] || guest.dietary);
    }
    if (showFamily && guest.familyName) subParts.push(guest.familyName);

    if (subParts.length > 0) {
      doc.text(subParts.join('  ·  '), centerX, subY, { align: 'center' });
    }

    // Bottom half — same name upside down (tent fold)
    doc.saveGraphicsState();
    const bottomCenterY = y + cardH * 0.75;
    doc.setFont('helvetica', style.nameFontStyle);
    doc.setFontSize(style.nameSize);
    doc.setTextColor(40, 40, 40);

    // Rotate 180° around the bottom-half center point
    const angle = 180;
    doc.text(`${guest.firstName} ${guest.lastName}`, centerX, bottomCenterY, {
      align: 'center',
      angle,
    });

    if (subParts.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(style.subSize);
      doc.setTextColor(120, 120, 120);
      doc.text(subParts.join('  ·  '), centerX, bottomCenterY - 5, {
        align: 'center',
        angle,
      });
    }
    doc.restoreGraphicsState();

    cardIndex++;
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
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });
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

  // Header row
  const colWidths = {
    num: 8,
    name: 45,
    family: 30,
    side: 15,
    dietary: 20,
    phone: 30,
  };
  const eventColW = Math.min(25, (pageW - margin * 2 - Object.values(colWidths).reduce((a, b) => a + b, 0)) / Math.max(events.length, 1));

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
    doc.text(evt.name.substring(0, 12), hx, y + 5);
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
