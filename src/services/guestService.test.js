import { describe, it, expect, vi, beforeEach } from 'vitest';

const batches = [];

function makeBatch() {
  const batch = {
    ops: [],
    set: vi.fn(function (ref, data) { this.ops.push({ type: 'set', ref, data }); }),
    update: vi.fn(function (ref, data) { this.ops.push({ type: 'update', ref, data }); }),
    delete: vi.fn(function (ref) { this.ops.push({ type: 'delete', ref }); }),
    commit: vi.fn(() => Promise.resolve()),
  };
  batches.push(batch);
  return batch;
}

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'mock-collection'),
  doc: vi.fn(() => 'mock-doc'),
  addDoc: vi.fn(() => Promise.resolve({ id: 'new-id' })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  writeBatch: vi.fn(() => makeBatch()),
  serverTimestamp: vi.fn(() => 'mock-timestamp'),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
}));

vi.mock('../firebase', () => ({ db: {} }));
vi.mock('../config/constants', () => ({
  COLLECTIONS: { WEDDINGS: 'weddings', GUESTS: 'guests', FAMILIES: 'families' },
}));

import {
  importGuestsBatch,
  deleteGuestsBatch,
  updateGuestsBatch,
  addFamily,
} from './guestService';

beforeEach(() => {
  batches.length = 0;
});

describe('guestService batch chunking', () => {
  it('commits a single batch when under the 450-op limit', async () => {
    const guests = Array.from({ length: 100 }, (_, i) => ({ firstName: `G${i}` }));
    const count = await importGuestsBatch('w1', guests);
    expect(count).toBe(100);
    expect(batches).toHaveLength(1);
    expect(batches[0].set).toHaveBeenCalledTimes(100);
    expect(batches[0].commit).toHaveBeenCalledTimes(1);
  });

  it('splits imports over 450 into multiple batches', async () => {
    const guests = Array.from({ length: 1000 }, (_, i) => ({ firstName: `G${i}` }));
    const count = await importGuestsBatch('w1', guests);
    expect(count).toBe(1000);
    // 1000 / 450 => 3 batches (450 + 450 + 100)
    expect(batches).toHaveLength(3);
    expect(batches[0].set).toHaveBeenCalledTimes(450);
    expect(batches[1].set).toHaveBeenCalledTimes(450);
    expect(batches[2].set).toHaveBeenCalledTimes(100);
    batches.forEach((b) => expect(b.commit).toHaveBeenCalledTimes(1));
  });

  it('chunks deletes over the limit', async () => {
    const ids = Array.from({ length: 500 }, (_, i) => `id-${i}`);
    await deleteGuestsBatch('w1', ids);
    expect(batches).toHaveLength(2);
    expect(batches[0].delete).toHaveBeenCalledTimes(450);
    expect(batches[1].delete).toHaveBeenCalledTimes(50);
  });

  it('chunks updates over the limit', async () => {
    const updates = Array.from({ length: 460 }, (_, i) => ({ guestId: `id-${i}`, data: { x: i } }));
    await updateGuestsBatch('w1', updates);
    expect(batches).toHaveLength(2);
    expect(batches[0].update).toHaveBeenCalledTimes(450);
    expect(batches[1].update).toHaveBeenCalledTimes(10);
  });

  it('handles empty arrays without committing a batch', async () => {
    const count = await importGuestsBatch('w1', []);
    expect(count).toBe(0);
    expect(batches).toHaveLength(0);
  });
});

describe('addFamily validation', () => {
  it('rejects a missing family name', async () => {
    await expect(addFamily('w1', {})).rejects.toThrow('Family name is required');
  });

  it('rejects a whitespace-only family name', async () => {
    await expect(addFamily('w1', { familyName: '   ' })).rejects.toThrow('Family name is required');
  });

  it('trims and accepts a valid family name', async () => {
    const id = await addFamily('w1', { familyName: '  Patel  ' });
    expect(id).toBe('new-id');
  });
});
