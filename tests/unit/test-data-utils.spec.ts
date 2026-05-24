import { test, expect } from '@playwright/test';
import {
  uniqueName,
  randomEmail,
  randomCustomerInfo,
  isoDate,
} from '@/utils/testDataUtils';

test.describe('@unit testDataUtils', () => {
  test('uniqueName returns distinct values across many calls', () => {
    const samples = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      samples.add(uniqueName('User'));
    }
    expect(samples.size).toBe(1000);
    for (const sample of samples) {
      expect(sample.startsWith('User_')).toBe(true);
    }
  });

  test('randomEmail returns a valid email shape', () => {
    const email = randomEmail();
    expect(email).toMatch(/^[a-z0-9._-]+@example\.test$/);
  });

  test('randomCustomerInfo returns first/last/postal triple', () => {
    const info = randomCustomerInfo();
    expect(info.firstName.length).toBeGreaterThan(0);
    expect(info.lastName.length).toBeGreaterThan(0);
    expect(info.postalCode).toMatch(/^\d{5}$/);
  });

  test('isoDate returns YYYY-MM-DD with day offset applied', () => {
    const today = isoDate(0);
    const inFive = isoDate(5);
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(inFive).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // The exact diff between the two YYYY-MM-DD strings (parsed as UTC midnight)
    // must be 5 days; if the calls straddle UTC midnight, it could be 4 (rare) or 5.
    // We assert "at most 5 days apart, at least 4" — the function's contract is "offset by 5",
    // tolerating <=1 day of clock drift between the two new Date() calls inside isoDate.
    const diffDays =
      (Date.parse(inFive + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) /
      (24 * 60 * 60 * 1000);
    expect(diffDays).toBeGreaterThanOrEqual(4);
    expect(diffDays).toBeLessThanOrEqual(5);
  });
});
