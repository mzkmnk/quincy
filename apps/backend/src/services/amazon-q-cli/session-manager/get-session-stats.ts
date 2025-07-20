import type { QProcessSession } from './types';
import { getSessionRuntime } from './get-session-runtime';

export function getSessionStats(
  sessions: Map<string, QProcessSession>,
  sessionId: string
): {
  sessionId: string;
  pid?: number;
  status: string;
  runtime: number;
  memoryUsage?: number;
  cpuUsage?: number;
  workingDir: string;
  command: string;
  startTime: number;
  lastActivity: number;
  isActive: boolean;
} | null {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    pid: session.pid,
    status: session.status,
    runtime: getSessionRuntime(sessions, sessionId),
    memoryUsage: session.memoryUsage,
    cpuUsage: session.cpuUsage,
    workingDir: session.workingDir,
    command: session.command,
    startTime: session.startTime,
    lastActivity: session.lastActivity,
    isActive: ['starting', 'running'].includes(session.status),
  };
}
