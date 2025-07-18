import type { QProcessSession } from '../session-manager/types';
import type { QInfoEvent } from '@quincy/shared';
import { combineInitializationMessages } from './combine-initialization-messages';

export function flushInitializationBuffer(
  session: QProcessSession,
  emitCallback: (event: string, data: any) => void
): void {
  if (session.initializationBuffer.length === 0 || !session.initializationPhase) {
    return;
  }
  
  // 初期化フェーズを終了（重複防止）
  session.initializationPhase = false;
  
  // メッセージを整理・統合
  const combinedMessage = combineInitializationMessages(session.initializationBuffer);
  
  // 統合メッセージを送信
  const infoEvent: QInfoEvent = {
    sessionId: session.sessionId,
    message: combinedMessage,
    type: 'initialization'
  };
  
  emitCallback('q:info', infoEvent);
  
  // バッファをクリア
  session.initializationBuffer = [];
  
  // タイムアウトをクリア
  if (session.initializationTimeout) {
    clearTimeout(session.initializationTimeout);
    session.initializationTimeout = undefined;
  }
}