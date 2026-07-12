import { TABLE_DEFAULTS } from '../../config/constants';

const ZONE_ALIASES = {
  dance: 'dance-floor',
  'dance floor': 'dance-floor',
  dancefloor: 'dance-floor',
  'dance-floor': 'dance-floor',
  floor: 'dance-floor',
  dj: 'dj',
  'dj booth': 'dj',
  booth: 'dj',
  stage: 'stage',
  mandap: 'stage',
  riser: 'stage',
  bar: 'bar',
  'cocktail bar': 'bar',
  gift: 'gifts',
  gifts: 'gifts',
  'gift table': 'gifts',
  cards: 'gifts',
  cake: 'cake',
  'cake table': 'cake',
  dessert: 'desserts',
  desserts: 'desserts',
  sweets: 'desserts',
  photo: 'photo',
  'photo booth': 'photo',
  photobooth: 'photo',
  entrance: 'entrance',
  entry: 'entrance',
  door: 'entrance',
  doors: 'entrance',
  'custom zone': 'custom',
  zone: 'custom',
};

const SHAPE_ALIASES = {
  round: 'round',
  circle: 'round',
  circular: 'round',
  rectangle: 'rectangle',
  rectangular: 'rectangle',
  estate: 'rectangle',
  'estate table': 'rectangle',
  'long estate': 'rectangle',
  square: 'square',
  oval: 'oval',
  'u shape': 'u-shape',
  ushape: 'u-shape',
  'u-shape': 'u-shape',
  head: 'head-table',
  'head table': 'head-table',
  'head-table': 'head-table',
  cocktail: 'cocktail',
  standing: 'cocktail',
  custom: 'custom',
};

const HEADER_ALIASES = {
  name: ['name', 'table', 'table name', 'label'],
  shape: ['shape', 'type', 'table shape', 'item type', 'zone type'],
  capacity: ['seat', 'seats', 'capacity', 'guests', 'guest count'],
  x: ['x', 'x position', 'position x', 'left'],
  y: ['y', 'y position', 'position y', 'top'],
  width: ['width', 'w'],
  height: ['height', 'h'],
};

function normalize(value) {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function strictNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return undefined;
  const number = Number(String(value).trim());
  return Number.isFinite(number) ? number : undefined;
}

function nonNegativeNumber(value) {
  const number = strictNumber(value);
  return number !== undefined && number >= 0 ? number : undefined;
}

function positiveNumber(value) {
  const number = strictNumber(value);
  return number !== undefined && number > 0 ? number : undefined;
}

function boundedInteger(value, fallback, min, max) {
  const number = strictNumber(value);
  if (number === undefined) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

function canonicalShape(value) {
  return SHAPE_ALIASES[normalize(value)] || 'round';
}

function findHeaderIndex(header, field) {
  const aliases = HEADER_ALIASES[field];
  return header.findIndex((cell) => aliases.includes(cell));
}

function buildHeaderMap(row) {
  const normalized = row.map(normalize);
  const map = Object.fromEntries(
    Object.keys(HEADER_ALIASES).map((field) => [field, findHeaderIndex(normalized, field)]),
  );
  const matchCount = Object.values(map).filter((index) => index >= 0).length;
  return {
    map,
    isHeader: map.name >= 0 && matchCount >= 2,
  };
}

export function rowToSeatingItem(row) {
  const name = String(row.name ?? '').trim();
  if (!name) return null;

  const type = normalize(row.shape);
  const zoneType = ZONE_ALIASES[type];
  const common = {
    x: nonNegativeNumber(row.x),
    y: nonNegativeNumber(row.y),
    width: positiveNumber(row.width),
    height: positiveNumber(row.height),
  };

  if (zoneType) {
    return {
      __zone: true,
      type: zoneType,
      name,
      ...common,
    };
  }

  const shape = canonicalShape(type);
  const defaults = TABLE_DEFAULTS[shape] || TABLE_DEFAULTS.round;
  return {
    name,
    shape,
    capacity: boundedInteger(row.capacity, defaults.capacity, 1, 50),
    ...common,
  };
}

export function parseSpreadsheetRows(rows) {
  const usableRows = (rows || []).filter((row) =>
    Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''),
  );
  if (usableRows.length === 0) return [];

  const { map, isHeader } = buildHeaderMap(usableRows[0]);
  const indexes = isHeader
    ? map
    : { name: 0, shape: 1, capacity: 2, x: 3, y: 4, width: 5, height: 6 };
  const body = isHeader ? usableRows.slice(1) : usableRows;
  const valueAt = (row, index) => (index >= 0 ? row[index] : undefined);

  return body
    .map((row) => rowToSeatingItem({
      name: valueAt(row, indexes.name),
      shape: valueAt(row, indexes.shape),
      capacity: valueAt(row, indexes.capacity),
      x: valueAt(row, indexes.x),
      y: valueAt(row, indexes.y),
      width: valueAt(row, indexes.width),
      height: valueAt(row, indexes.height),
    }))
    .filter(Boolean);
}

export function parseDelimitedLine(line) {
  const delimiter = line.includes('\t') ? '\t' : ',';
  const cells = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

export function parseSeatingText(input) {
  const rows = String(input || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map(parseDelimitedLine);
  return parseSpreadsheetRows(rows);
}

export function createQuickTableConfigs({
  count,
  shape,
  capacity,
  existingCount = 0,
}) {
  const safeCount = boundedInteger(count, 1, 1, 100);
  const safeShape = canonicalShape(shape);
  const defaults = TABLE_DEFAULTS[safeShape] || TABLE_DEFAULTS.round;
  const safeCapacity = boundedInteger(capacity, defaults.capacity, 1, 50);
  const start = boundedInteger(existingCount, 0, 0, 100000);

  return Array.from({ length: safeCount }, (_, index) => ({
    name: `Table ${start + index + 1}`,
    shape: safeShape,
    capacity: safeCapacity,
  }));
}
