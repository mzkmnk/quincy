import type { QProcessSession } from '../../../types';

/**
 * 重複するthinkingメッセージかどうかを判定する
 * @param cleanLine クリーンな行
 * @param session プロセスセッション
 * @returns 重複している場合true
 */
export function isDuplicateThinking(cleanLine: string, session: QProcessSession): boolean {
  const trimmed = cleanLine.trim().toLowerCase();
  
  // thinkingメッセージかどうかをチェック
  const isThinking = trimmed === 'thinking' || 
                     trimmed === 'thinking...' || 
                     trimmed === 'thinking....' ||
                     /^thinking\.{0,4}$/i.test(trimmed);
  
  if (!isThinking) {
    return false;
  }
  
  // 同じthinkingメッセージが最近送信されているかチェック
  const currentTime = Date.now();
  const isSameMessage = session.lastThinkingMessage === trimmed;
  const isRecent = (currentTime - session.lastInfoMessageTime) < 1000; // 1秒以内
  
  if (isSameMessage && isRecent) {
    return true; // 重複している
  }
  
  // 新しいthinkingメッセージとして記録（shouldSendThinkingで送信が決定された場合のみ更新される）
  // ここでは更新しない（thinking送信制御と分離するため）
  
  return false; // 重複していない
}