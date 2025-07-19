import { sessionToSockets } from './session-socket-map';

export function cleanupSession(sessionId: string): void {
  sessionToSockets.delete(sessionId);
}
