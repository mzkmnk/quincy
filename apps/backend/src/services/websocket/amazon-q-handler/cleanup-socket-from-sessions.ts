import { sessionToSockets } from './session-socket-map';

export function cleanupSocketFromSessions(socketId: string): void {
  sessionToSockets.forEach((socketIds, sessionId) => {
    if (socketIds.has(socketId)) {
      socketIds.delete(socketId);
      // セッションにソケットが残っていない場合は削除
      if (socketIds.size === 0) {
        sessionToSockets.delete(sessionId);
      }
    }
  });
}
