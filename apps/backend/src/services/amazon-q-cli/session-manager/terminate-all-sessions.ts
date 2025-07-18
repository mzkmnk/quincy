import type { QProcessSession } from './types';

export async function terminateAllSessions(
  sessions: Map<string, QProcessSession>,
  abortSessionFn: (sessionId: string, reason: string) => Promise<boolean>
): Promise<void> {
  const activeSessionIds = Array.from(sessions.keys());
  const terminations = activeSessionIds.map(sessionId => 
    abortSessionFn(sessionId, 'shutdown')
  );
  
  await Promise.allSettled(terminations);
}