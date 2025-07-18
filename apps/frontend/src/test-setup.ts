import 'zone.js';

// Mock globals that might be used in tests
global.structuredClone = structuredClone || ((obj: any) => JSON.parse(JSON.stringify(obj)));