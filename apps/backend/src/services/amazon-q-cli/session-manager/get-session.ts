import type { QProcessSession } from './types';

export function getSession(
  sessions: Map<string, QProcessSession>,
  sessionId: string
): QProcessSession | undefined {
  return sessions.get(sessionId);
}