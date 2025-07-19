import type { QProcessSession } from '../session-manager/types';

import { monitorResources } from './monitor-resources';

export async function updateAllSessionResources(
  sessions: Map<string, QProcessSession>
): Promise<void> {
  const activeSessions = Array.from(sessions.values()).filter(session =>
    ['starting', 'running'].includes(session.status)
  );

  for (const session of activeSessions) {
    await monitorResources(session);
  }
}
