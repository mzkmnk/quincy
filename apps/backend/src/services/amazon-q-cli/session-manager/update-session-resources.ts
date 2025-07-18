import type { QProcessSession } from './types';
import { monitorResources } from '../process-manager/monitor-resources';

export async function updateSessionResources(
  sessions: Map<string, QProcessSession>,
  sessionId: string
): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }

  await monitorResources(session);
}