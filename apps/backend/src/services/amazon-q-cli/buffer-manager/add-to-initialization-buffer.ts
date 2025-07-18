import type { QProcessSession } from '../session-manager/types';
import { isInitializationComplete } from '../message-handler';

export function addToInitializationBuffer(
  session: QProcessSession,
  message: string,
  flushInitializationBufferCallback: (session: QProcessSession) => void
): void {
  if (!session.initializationPhase) {
    return; // 初期化フェーズでない場合はスキップ
  }
  
  // 初期化中もアクティビティを更新
  session.lastActivity = Date.now();
  session.initializationBuffer.push(message);
  
  // 初期化完了をチェック
  if (isInitializationComplete(message)) {
    // 1秒後に初期化バッファをフラッシュ（遅延メッセージを待つため）
    if (session.initializationTimeout) {
      clearTimeout(session.initializationTimeout);
    }
    
    session.initializationTimeout = setTimeout(() => {
      flushInitializationBufferCallback(session);
    }, 1000);
  } else {
    // 通常のタイムアウト（15秒に延長）
    if (session.initializationTimeout) {
      clearTimeout(session.initializationTimeout);
    }
    
    session.initializationTimeout = setTimeout(() => {
      flushInitializationBufferCallback(session);
    }, 15000); // 15秒に延長
  }
}