import type { QInfoEvent, QErrorEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';
import { stripAnsiCodes } from '../../../utils/ansi-stripper';
import {
  classifyStderrMessage,
  isInitializationMessage,
  shouldSkipDuplicateInfo,
  getInfoMessageType,
} from '../message-handler';

export function flushIncompleteErrorLine(
  session: QProcessSession,
  emitCallback: (event: string, data: QInfoEvent | QErrorEvent) => void,
  addToInitializationBufferCallback: (session: QProcessSession, message: string) => void
): void {
  if (!session.incompleteErrorLine.trim()) {
    return;
  }

  const cleanLine = stripAnsiCodes(session.incompleteErrorLine);
  const messageType = classifyStderrMessage(cleanLine);

  if (messageType === 'info') {
    // 初期化フェーズの処理
    if (session.initializationPhase && isInitializationMessage(cleanLine)) {
      addToInitializationBufferCallback(session, cleanLine);
      // 不完全な行をクリア
      session.incompleteErrorLine = '';
      return;
    }

    // Thinkingメッセージはそのまま通す（特別処理なし）
    // 重複メッセージチェック
    if (!shouldSkipDuplicateInfo(session, cleanLine)) {
      const infoEvent: QInfoEvent = {
        sessionId: session.sessionId,
        message: cleanLine,
        type: getInfoMessageType(cleanLine),
      };

      emitCallback('q:info', infoEvent);
    }
  } else if (messageType === 'error') {
    const errorEvent: QErrorEvent = {
      sessionId: session.sessionId,
      error: cleanLine,
      code: 'STDERR',
    };

    emitCallback('q:error', errorEvent);
  }

  // 不完全な行をクリア
  session.incompleteErrorLine = '';
}
