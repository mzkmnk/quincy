import { sessionToSockets } from './session-socket-map';

export function addSocketToSession(sessionId: string, socketId: string): void {
  if (!sessionToSockets.has(sessionId)) {
    sessionToSockets.set(sessionId, new Set());
  }
  sessionToSockets.get(sessionId)!.add(socketId);
}
