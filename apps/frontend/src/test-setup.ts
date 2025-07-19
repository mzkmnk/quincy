// Test setup for Angular 20
// Note: Angular component tests removed due to Zone.js compatibility issues

// Mock structuredClone if not available
if (typeof structuredClone === 'undefined') {
  (globalThis as typeof globalThis & { structuredClone: <T>(obj: T) => T }).structuredClone = 
    <T>(obj: T): T => JSON.parse(JSON.stringify(obj));
}
