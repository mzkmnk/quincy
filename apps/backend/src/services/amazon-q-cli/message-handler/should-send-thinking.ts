import type { QProcessSession } from '../../../types';

/**
 * thinkingメッセージを送信すべきかどうかを判定する
 * @param session プロセスセッション
 * @param message メッセージ内容
 * @returns 送信すべき場合true
 */
export function shouldSendThinking(session: QProcessSession, message: string): boolean {
  if (!session.hasThinkingSent) {
    // 初回のthinkingメッセージは送信し、フラグと履歴を更新
    session.hasThinkingSent = true;
    session.lastThinkingMessage = message.trim().toLowerCase();
    session.lastInfoMessageTime = Date.now();
    return true;
  }

  // 既に送信済みの場合は送信しない
  return false;
}

/**
 * thinkingフラグをリセットする（プロンプト表示時）
 * @param session プロセスセッション
 */
export function resetThinkingFlag(session: QProcessSession): void {
  session.hasThinkingSent = false;
  session.lastThinkingMessage = '';
  session.lastInfoMessageTime = 0;
}

/**
 * 新規メッセージ送信時にthinkingフラグをリセットする
 * @param session プロセスセッション
 */
export function resetThinkingFlagForNewMessage(session: QProcessSession): void {
  session.hasThinkingSent = false;
  session.lastThinkingMessage = '';
  session.lastInfoMessageTime = 0;
}
