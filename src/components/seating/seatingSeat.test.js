import { describe, it, expect } from 'vitest';
import { isIndividualSeat } from './seatingSeat';

describe('isIndividualSeat', () => {
  it('treats capacity-1 ceremony chairs as individual seats', () => {
    expect(isIndividualSeat({ capacity: 1, shape: 'square' })).toBe(true);
  });

  it('treats zero/invalid capacity as an individual seat', () => {
    expect(isIndividualSeat({ capacity: 0 })).toBe(true);
  });

  it('treats multi-seat tables as assignable tables', () => {
    expect(isIndividualSeat({ capacity: 10, shape: 'round' })).toBe(false);
    expect(isIndividualSeat({ capacity: 8 })).toBe(false);
    expect(isIndividualSeat({ capacity: 2 })).toBe(false);
  });

  it('is safe with missing input', () => {
    expect(isIndividualSeat(null)).toBe(false);
    expect(isIndividualSeat(undefined)).toBe(false);
    expect(isIndividualSeat({})).toBe(false);
  });
});
