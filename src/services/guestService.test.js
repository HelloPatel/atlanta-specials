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
  setDoc: vi.fn(() => Promise.resolve()),
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
  COLLECTIONS: { WEDDINGS: 'weddings', GUESTS: 'guests', PUBLIC_GUESTS: 'publicGuests', FAMILIES: 'families' },
}));

import {
  importGuestsBatch,
  deleteGuestsBatch,
  updateGuestsBatch,
  addFamily,
  toPublicGuest,
} from './guestService';

beforeEach(() => {
  batches.length = 0;
});

describe('guestService batch chunking', () => {
  it('commits private and public records in one batch when under the write limit', async () => {
    const guests = Array.from({ length: 100 }, (_, i) => ({ firstName: `G${i}` }));
    const count = await importGuestsBatch('w1', guests);
    expect(count).toBe(100);
    expect(batches).toHaveLength(1);
    expect(batches[0].set).toHaveBeenCalledTimes(200);
    expect(batches[0].commit).toHaveBeenCalledTimes(1);
  });

  it('splits dual-write imports before Firestore reaches 500 operations', async () => {
    const guests = Array.from({ length: 1000 }, (_, i) => ({ firstName: `G${i}` }));
    const count = await importGuestsBatch('w1', guests);
    expect(count).toBe(1000);
    // 225 guests per batch x 2 writes each.
    expect(batches).toHaveLength(5);
    expect(batches[0].set).toHaveBeenCalledTimes(450);
    expect(batches[1].set).toHaveBeenCalledTimes(450);
    expect(batches[2].set).toHaveBeenCalledTimes(450);
    expect(batches[3].set).toHaveBeenCalledTimes(450);
    expect(batches[4].set).toHaveBeenCalledTimes(200);
    batches.forEach((b) => expect(b.commit).toHaveBeenCalledTimes(1));
  });

  it('chunks deletes over the limit', async () => {
    const ids = Array.from({ length: 500 }, (_, i) => `id-${i}`);
    await deleteGuestsBatch('w1', ids);
    expect(batches).toHaveLength(3);
    expect(batches[0].delete).toHaveBeenCalledTimes(450);
    expect(batches[1].delete).toHaveBeenCalledTimes(450);
    expect(batches[2].delete).toHaveBeenCalledTimes(100);
  });

  it('chunks updates over the limit', async () => {
    const updates = Array.from({ length: 460 }, (_, i) => ({
      guestId: `id-${i}`,
      data: { x: i },
      currentGuest: { firstName: `Guest ${i}` },
    }));
    await updateGuestsBatch('w1', updates);
    expect(batches).toHaveLength(3);
    expect(batches[0].update).toHaveBeenCalledTimes(225);
    expect(batches[0].set).toHaveBeenCalledTimes(225);
    expect(batches[1].update).toHaveBeenCalledTimes(225);
    expect(batches[1].set).toHaveBeenCalledTimes(225);
    expect(batches[2].update).toHaveBeenCalledTimes(10);
    expect(batches[2].set).toHaveBeenCalledTimes(10);
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

  describe('public guest projection', () => {
    it('keeps RSVP lookup fields and removes private guest details', () => {
      const result = toPublicGuest({
        firstName: 'Mira',
        lastName: 'Patel',
        familyName: 'Patel',
        phone: '+1 404 555 0198',
        email: 'mira@example.com',
        dietary: 'jain',
        notes: 'Private note',
        tags: ['Kids', 'VIP'],
      });

      expect(result).toMatchObject({
        firstName: 'Mira',
        lastName: 'Patel',
        familyName: 'Patel',
        phoneLast4: '0198',
        isChild: true,
      });
      expect(result).not.toHaveProperty('phone');
      expect(result).not.toHaveProperty('email');
      expect(result).not.toHaveProperty('dietary');
      expect(result).not.toHaveProperty('notes');
      expect(result).not.toHaveProperty('tags');
    });
  });

  it('rejects a whitespace-only family name', async () => {
    await expect(addFamily('w1', { familyName: '   ' })).rejects.toThrow('Family name is required');
  });

  it('trims and accepts a valid family name', async () => {
    const id = await addFamily('w1', { familyName: '  Patel  ' });
    expect(id).toBe('new-id');
  });
});
