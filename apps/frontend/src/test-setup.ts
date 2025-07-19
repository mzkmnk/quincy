import 'zone.js';

// Mock globals that might be used in tests
(globalThis as any).structuredClone = structuredClone || ((obj: any) => JSON.parse(JSON.stringify(obj)));