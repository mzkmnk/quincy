import type { QProcessSession } from './types';

export function getSessionRuntime(
  sessions: Map<string, QProcessSession>,
  sessionId: string
): number {
  const session = sessions.get(sessionId);
  if (!session) {
    return 0;
  }

  return Date.now() - session.startTime;
}
