import type { QProcessSession } from './types';

export async function sendInput(
  sessions: Map<string, QProcessSession>,
  sessionId: string,
  input: string
): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session) {
    return false;
  }

  if (!['starting', 'running'].includes(session.status)) {
    return false;
  }

  try {
    if (session.process.stdin && !session.process.stdin.destroyed) {
      session.process.stdin.write(input);
      session.lastActivity = Date.now();
      return true;
    } else {
      return false;
    }
  } catch (_error) {
    return false;
  }
}