import 'zone.js';

// Mock globals that might be used in tests
declare global {
  interface Window {
    structuredClone: <T>(value: T) => T;
  }
}

if (typeof structuredClone === 'undefined') {
  (globalThis as unknown as Window).structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}
