import type { QResponseEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';

export function flushOutputBuffer(
  session: QProcessSession,
  emitCallback: (event: string, data: QResponseEvent) => void
): void {
  if (!session.outputBuffer.trim()) {
    return;
  }

  const responseEvent: QResponseEvent = {
    sessionId: session.sessionId,
    data: session.outputBuffer,
    type: 'stream'
  };
  
  emitCallback('q:response', responseEvent);
  
  // バッファをクリア
  session.outputBuffer = '';
  
  // タイムアウトをクリア
  if (session.bufferTimeout) {
    clearTimeout(session.bufferTimeout);
    session.bufferTimeout = undefined;
  }
}