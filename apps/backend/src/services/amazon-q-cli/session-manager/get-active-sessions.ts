import type { QProcessSession } from './types';

export function getActiveSessions(sessions: Map<string, QProcessSession>): QProcessSession[] {
  return Array.from(sessions.values()).filter(session =>
    ['starting', 'running'].includes(session.status)
  );
}
