import type { QResponseEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';
import { stripAnsiCodes } from '../../../utils/ansi-stripper';
import { shouldSkipOutput, isInitializationMessage, isThinkingMessage, shouldSkipThinking, updateThinkingState } from '../message-handler';

export function flushIncompleteOutputLine(
  session: QProcessSession,
  emitCallback: (event: string, data: QResponseEvent) => void
): void {
  if (!session.incompleteOutputLine.trim()) {
    return;
  }
  
  const cleanLine = stripAnsiCodes(session.incompleteOutputLine);
  
  // 無意味な行はスキップ
  if (!shouldSkipOutput(cleanLine)) {
    // 初期化フェーズで初期化メッセージはスキップ
    if (session.initializationPhase && isInitializationMessage(cleanLine)) {
      session.incompleteOutputLine = '';
      return;
    }
    
    // Thinkingメッセージの重複チェック
    if (isThinkingMessage(cleanLine) && shouldSkipThinking(session)) {
      // 不完全な行をクリア
      session.incompleteOutputLine = '';
      return;
    }
    
    if (isThinkingMessage(cleanLine)) {
      updateThinkingState(session);
    }
    
    const responseEvent: QResponseEvent = {
      sessionId: session.sessionId,
      data: cleanLine,
      type: 'stream'
    };
    
    emitCallback('q:response', responseEvent);
  }
  
  // 不完全な行をクリア
  session.incompleteOutputLine = '';
}