const FIRST_NAMES = ['Alice', 'Bob', 'Carol', 'David', 'Eva', 'Frank', 'Grace', 'Hank'];
const LAST_NAMES = ['Adams', 'Brown', 'Clark', 'Davis', 'Evans', 'Foster', 'Green', 'Hall'];

let counter = 0;

export function uniqueName(base: string): string {
  counter += 1;
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base}_${ts}_${counter}_${rand}`;
}

export function randomEmail(): string {
  const localPart = Math.random().toString(36).slice(2, 10);
  return `${localPart}@example.test`;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export function randomCustomerInfo(): CustomerInfo {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const postalCode = String(10000 + Math.floor(Math.random() * 89999));
  return { firstName, lastName, postalCode };
}

export function isoDate(offsetDays: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}
