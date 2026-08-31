import { describe, it, expect } from 'vitest';
import {
  computeBudgetSummary,
  itemCommitted,
  itemBalance,
  toAmount,
  formatCurrency,
} from './budgetService';

describe('toAmount', () => {
  it('coerces strings, strips symbols, and floors at zero', () => {
    expect(toAmount('$1,200.50')).toBe(1200.5);
    expect(toAmount('abc')).toBe(0);
    expect(toAmount(-50)).toBe(0);
    expect(toAmount(undefined)).toBe(0);
    expect(toAmount(99.999)).toBe(100);
  });
});

describe('itemCommitted / itemBalance', () => {
  it('uses actual when present, else estimated', () => {
    expect(itemCommitted({ estimated: 100, actual: 0 })).toBe(100);
    expect(itemCommitted({ estimated: 100, actual: 120 })).toBe(120);
  });

  it('balance is committed minus paid, never negative', () => {
    expect(itemBalance({ estimated: 100, actual: 0, paid: 30 })).toBe(70);
    expect(itemBalance({ estimated: 100, actual: 120, paid: 200 })).toBe(0);
  });
});

describe('computeBudgetSummary', () => {
  const items = [
    { category: 'Venue', estimated: 10000, actual: 12000, paid: 5000 },
    { category: 'Catering', estimated: 8000, actual: 0, paid: 2000 },
    { category: 'Venue', estimated: 500, actual: 400, paid: 400 },
  ];

  it('rolls up totals across items', () => {
    const s = computeBudgetSummary(items, 25000);
    expect(s.itemCount).toBe(3);
    expect(s.totalEstimated).toBe(18500);
    // committed: 12000 + 8000(est) + 400 = 20400
    expect(s.totalCommitted).toBe(20400);
    expect(s.totalPaid).toBe(7400);
    // balance: 7000 + 6000 + 0 = 13000
    expect(s.totalBalance).toBe(13000);
    expect(s.target).toBe(25000);
    expect(s.remainingVsTarget).toBe(4600);
  });

  it('counts items whose actual exceeds estimate', () => {
    const s = computeBudgetSummary(items);
    expect(s.overBudgetCount).toBe(1); // only Venue 12000 > 10000
  });

  it('groups by category sorted by committed spend', () => {
    const s = computeBudgetSummary(items);
    expect(s.categories[0].category).toBe('Venue');
    expect(s.categories[0].committed).toBe(12400);
    expect(s.categories[0].count).toBe(2);
    const catering = s.byCategory.Catering;
    expect(catering.committed).toBe(8000);
  });

  it('handles an empty list without a target', () => {
    const s = computeBudgetSummary([]);
    expect(s.itemCount).toBe(0);
    expect(s.totalCommitted).toBe(0);
    expect(s.categories).toEqual([]);
    expect(s.remainingVsTarget).toBeNull();
  });
});

describe('formatCurrency', () => {
  it('formats whole numbers without decimals', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
  });

  it('keeps cents when present', () => {
    expect(formatCurrency(1000.5)).toBe('$1,000.50');
  });
});
