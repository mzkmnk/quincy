import { ChildProcess } from 'child_process';

import type { QProcessSession, QProcessOptions, SessionId } from '../../../types';

export function createSession(
  sessionId: SessionId,
  childProcess: ChildProcess,
  workingDir: string,
  command: string,
  options: QProcessOptions
): QProcessSession {
  return {
    sessionId,
    process: childProcess,
    workingDir,
    startTime: Date.now(),
    status: 'starting',
    lastActivity: Date.now(),
    pid: childProcess.pid,
    command,
    options,
    outputBuffer: '',
    errorBuffer: '',
    bufferFlushCount: 0,
    incompleteOutputLine: '',
    incompleteErrorLine: '',
    lastInfoMessage: '',
    lastInfoMessageTime: 0,
    isThinkingActive: false,
    lastThinkingTime: 0,
    initializationBuffer: [],
    initializationPhase: true,
    initializationTimeout: undefined,
  };
}
