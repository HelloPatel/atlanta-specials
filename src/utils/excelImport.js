import * as XLSX from 'xlsx';
import { invitedEventNamesForGuest, parseInvitedEventNames } from './eventInvites';

// Default column mapping for Indian wedding guest lists
const DEFAULT_COLUMN_MAP = {
  'first name': 'firstName',
  'firstname': 'firstName',
  'first': 'firstName',
  'last name': 'lastName',
  'lastname': 'lastName',
  'last': 'lastName',
  'name': '_fullName',
  'full name': '_fullName',
  'email': 'email',
  'phone': 'phone',
  'mobile': 'phone',
  'cell': 'phone',
  'telephone': 'phone',
  'phone number': 'phone',
  'family': 'familyName',
  'family name': 'familyName',
  'household': 'familyName',
  'side': 'side',
  'bride or groom': 'side',
  'bride/groom': 'side',
  'relation': 'relation',
  'relationship': 'relation',
  'dietary': 'dietary',
  'diet': 'dietary',
  'food': 'dietary',
  'veg/non-veg': 'dietary',
  'notes': 'notes',
  'comments': 'notes',
  'tags': '_tags',
  'plus one': 'plusOne',
  'plus one?': 'plusOne',
  'plusone': 'plusOne',
  'invited events': '_invitedEvents',
  'invited event': '_invitedEvents',
  'events': '_invitedEvents',
  'invited to': '_invitedEvents',
  'invited': '_invitedEvents',
};

const MAX_IMPORT_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_PATTERN = /\.(xlsx|xls|csv)$/i;

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function uniqueHeaders(headerRow) {
  const seen = new Map();
  return headerRow.map((header, index) => {
    const base = String(header ?? '').replace(/^\uFEFF/, '').trim() || `Column ${index + 1}`;
    const count = (seen.get(base.toLowerCase()) || 0) + 1;
    seen.set(base.toLowerCase(), count);
    return count === 1 ? base : `${base} (${count})`;
  });
}

export function parseRawGuestData(rawData) {
  const rows = (rawData || []).filter((row) => Array.isArray(row));
  const headerIndex = rows.findIndex((row) => row.some(hasValue));
  if (headerIndex < 0) {
    throw new Error('The file is empty');
  }

  const headers = uniqueHeaders(rows[headerIndex]);
  const dataRows = rows
    .slice(headerIndex + 1)
    .filter((row) => row.some(hasValue))
    .map((row) => Object.fromEntries(
      headers.map((header, index) => [
        header,
        row[index] !== undefined && row[index] !== null ? String(row[index]).trim() : '',
      ]),
    ));

  if (dataRows.length === 0) {
    throw new Error('File must include at least one guest row below the headers');
  }

  return { headers, rows: dataRows, rawData: rows };
}

/**
 * Parse an Excel or CSV file into an array of row objects.
 * Returns { headers: string[], rows: object[], rawData: any[][] }
 */
export function parseFile(file) {
  return new Promise((resolve, reject) => {
    if (!file?.name || !ALLOWED_FILE_PATTERN.test(file.name)) {
      reject(new Error('Choose an Excel or CSV file (.xlsx, .xls, or .csv)'));
      return;
    }
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      reject(new Error('This file is larger than 10 MB. Split it into smaller files and try again.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        resolve(parseRawGuestData(rawData));
      } catch (err) {
        reject(new Error('Failed to parse file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Auto-detect column mapping from headers.
 * Returns { [headerName]: guestFieldName }
 */
export function autoMapColumns(headers) {
  const mapping = {};
  headers.forEach((header) => {
    const key = header.replace(/^\uFEFF/, '').toLowerCase().trim();
    if (DEFAULT_COLUMN_MAP[key]) {
      mapping[header] = DEFAULT_COLUMN_MAP[key];
    }
  });
  return mapping;
}

/**
 * Transform raw rows using column mapping into guest objects.
 */
export function mapRowsToGuests(rows, columnMapping) {
  return rows.map((row) => {
    const guest = {};
    let fullName = '';
    let rawTags = '';
    let rawInvitedEvents = '';

    Object.entries(columnMapping).forEach(([header, field]) => {
      const value = String(row[header] ?? '').trim();

      if (field === '_fullName') {
        fullName = value;
      } else if (field === '_tags') {
        rawTags = value;
      } else if (field === '_invitedEvents') {
        rawInvitedEvents = value;
      } else if (field === 'side') {
        const lower = value.toLowerCase();
        if (/(groom|ladka|var)/.test(lower)) guest.side = 'groom';
        else if (/(bride|ladki|vadhu)/.test(lower)) guest.side = 'bride';
        else guest.side = '';
      } else if (field === 'dietary') {
        const lower = value.toLowerCase();
        if (lower.includes('jain')) guest.dietary = 'jain';
        else if (lower.includes('vegan')) guest.dietary = 'vegan';
        else if (/(non|meat|chicken)/.test(lower)) guest.dietary = 'non-veg';
        else if (/(veg|vegetarian)/.test(lower)) guest.dietary = 'vegetarian';
        else guest.dietary = '';
      } else if (field === 'plusOne') {
        guest.plusOne = /^(yes|y|true|1)$/i.test(value);
      } else {
        guest[field] = value;
      }
    });

    if (fullName) {
      const parts = fullName.split(/\s+/).filter(Boolean);
      if (!guest.firstName) guest.firstName = parts[0] || '';
      if (!guest.lastName) guest.lastName = parts.slice(1).join(' ');
    }
    guest.firstName = String(guest.firstName || '').trim();
    guest.lastName = String(guest.lastName || '').trim();
    if (rawTags || Object.values(columnMapping).includes('_tags')) {
      guest.tags = [...new Set(rawTags.split(/[,;]/).map((tag) => tag.trim()).filter(Boolean))];
    }
    if (rawInvitedEvents || Object.values(columnMapping).includes('_invitedEvents')) {
      guest._invitedEvents = parseInvitedEventNames(rawInvitedEvents);
    }

    return guest;
  });
}

export function validateColumnMapping(columnMapping) {
  const fields = Object.values(columnMapping).filter(Boolean);
  const errors = [];
  if (!fields.includes('firstName') && !fields.includes('_fullName')) {
    errors.push('Map a First Name or Full Name column before continuing.');
  }

  const duplicates = fields.filter((field, index) => fields.indexOf(field) !== index);
  if (duplicates.length > 0) {
    const labels = [...new Set(duplicates)].map((field) => field.replace(/^_/, '')).join(', ');
    errors.push(`Each guest field can only be mapped once. Check: ${labels}.`);
  }
  return errors;
}

export function analyzeGuestImport(rows, columnMapping, existingGuests = []) {
  const mappedGuests = mapRowsToGuests(rows, columnMapping);
  const invalidRows = mappedGuests
    .map((guest, index) => ({
      index,
      reasons: guest.firstName ? [] : ['Missing first or full name'],
    }))
    .filter((entry) => entry.reasons.length > 0);
  const invalidIndices = new Set(invalidRows.map((entry) => entry.index));
  const validEntries = mappedGuests
    .map((guest, index) => ({ guest, index }))
    .filter(({ index }) => !invalidIndices.has(index));
  const duplicateMatches = findDuplicates(
    existingGuests,
    validEntries.map(({ guest }) => guest),
  );
  const duplicates = duplicateMatches.map((duplicate) => ({
    ...duplicate,
    index: validEntries[duplicate.index].index,
  }));

  return {
    mappedGuests,
    invalidRows,
    duplicates,
  };
}

/**
 * Find potential duplicates in a list of guests.
 *
 * Name matches only count as duplicates WITHIN the same family. Indian guest
 * lists repeat first and last names heavily across different families (many
 * "Raj Patel"s who aren't the same person), so a bare name match would flag
 * distinct people. A shared, non-empty family is required before trusting a
 * name-based duplicate. Email and phone are unique identifiers, so they still
 * match across families.
 */
export function findDuplicates(existingGuests, newGuests) {
  const norm = (v) => (v ?? '').toString().toLowerCase().trim();
  const isMatch = (a, b) => {
    const nameMatch =
      norm(a.firstName) !== '' &&
      norm(a.firstName) === norm(b.firstName) &&
      norm(a.lastName) === norm(b.lastName) &&
      norm(a.familyName) !== '' &&
      norm(a.familyName) === norm(b.familyName);
    const emailMatch = b.email && norm(a.email) === norm(b.email);
    const phoneMatch = b.phone && norm(a.phone).replace(/\D/g, '') === norm(b.phone).replace(/\D/g, '');
    return nameMatch || emailMatch || phoneMatch;
  };

  const accepted = [];
  const dupes = [];
  newGuests.forEach((ng, idx) => {
    // Match against guests already in the wedding...
    let match = existingGuests.find((eg) => isMatch(eg, ng));
    // ...and against earlier rows in this same import batch (within-family/import dedup).
    if (!match) match = accepted.find((ag) => isMatch(ag, ng));
    if (match) dupes.push({ index: idx, existing: match, incoming: ng });
    else accepted.push(ng);
  });
  return dupes;
}

/**
 * Export guests to Excel file and trigger download.
 */
export function exportGuestsToExcel(guests, events = [], fileName = 'guest-list.xlsx') {
  const data = guests.map((g) => ({
    'First Name': g.firstName,
    'Last Name': g.lastName,
    'Email': g.email,
    'Phone': g.phone,
    'Family': g.familyName,
    'Side': g.side,
    'Relation': g.relation,
    'Dietary': g.dietary,
    'Tags': (g.tags || []).join(', '),
    'Invited Events': invitedEventNamesForGuest(g, events).join(', '),
    'RSVP': Object.values(g.rsvpStatus || {}).includes('accepted') ? 'Accepted' : Object.values(g.rsvpStatus || {}).includes('declined') ? 'Declined' : 'Pending',
    'Viewed RSVP': g.rsvpViewedAt ? 'Yes' : 'No',
    'Checked In': g.checkedIn ? 'Yes' : 'No',
    'Notes': g.notes,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guests');
  XLSX.writeFile(wb, fileName);
}

/**
 * Download an Excel template with example data for guest import.
 */
export function downloadGuestTemplate() {
  const exampleData = [
    {
      'First Name': 'Priya',
      'Last Name': 'Sharma',
      'Email': 'priya.sharma@email.com',
      'Phone': '555-0101',
      'Family': 'The Sharma Family',
      'Side': 'Bride',
      'Relation': 'Cousin',
      'Dietary': 'Vegetarian',
      'Tags': 'VIP',
      'Invited Events': 'Ceremony, Reception',
      'Notes': '',
    },
    {
      'First Name': 'Raj',
      'Last Name': 'Sharma',
      'Email': 'raj.sharma@email.com',
      'Phone': '555-0102',
      'Family': 'The Sharma Family',
      'Side': 'Bride',
      'Relation': 'Uncle',
      'Dietary': 'Vegetarian',
      'Tags': 'VIP, Elderly',
      'Invited Events': 'Ceremony, Reception',
      'Notes': 'Needs wheelchair accessible seating',
    },
    {
      'First Name': 'Anita',
      'Last Name': 'Patel',
      'Email': 'anita.p@email.com',
      'Phone': '555-0201',
      'Family': 'The Patel Family',
      'Side': 'Groom',
      'Relation': 'Family Friend',
      'Dietary': 'Jain (No onion/garlic)',
      'Tags': '',
      'Invited Events': 'Reception',
      'Notes': '',
    },
    {
      'First Name': 'Vikram',
      'Last Name': 'Mehta',
      'Email': '',
      'Phone': '555-0301',
      'Family': 'The Mehta Family',
      'Side': 'Groom',
      'Relation': 'College Friend',
      'Dietary': 'Non-Vegetarian',
      'Tags': 'College Friend',
      'Invited Events': 'Sangeet, Reception',
      'Notes': 'Coming with wife Neha',
    },
    {
      'First Name': 'Sita',
      'Last Name': 'Reddy',
      'Email': 'sita.r@email.com',
      'Phone': '',
      'Family': 'The Reddy Family',
      'Side': 'Bride',
      'Relation': 'Aunt',
      'Dietary': 'Vegan',
      'Tags': 'Elderly',
      'Invited Events': 'Ceremony',
      'Notes': 'No dairy options',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(exampleData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, { wch: 14 }, { wch: 24 }, { wch: 12 },
    { wch: 20 }, { wch: 8 }, { wch: 16 }, { wch: 22 },
    { wch: 18 }, { wch: 24 }, { wch: 36 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Guest Template');
  XLSX.writeFile(wb, 'phera-guest-template.xlsx');
}
