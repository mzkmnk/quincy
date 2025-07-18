import type { QProcessSession } from '../session-manager/types';

export function shouldSkipDuplicateInfo(session: QProcessSession, message: string): boolean {
  const trimmed = message.trim().toLowerCase();
  const now = Date.now();
  
  // その他の繰り返しやすいメッセージの処理
  const duplicatePatterns = [
    /^loading/,
    /^initializing/,
    /^connecting/,
    /^processing/,
    /^please wait/
  ];
  
  if (duplicatePatterns.some(pattern => pattern.test(trimmed))) {
    // 3秒以内の同じメッセージは重複とみなす
    if (session.lastInfoMessage === trimmed && (now - session.lastInfoMessageTime) < 3000) {
      return true;
    }
    session.lastInfoMessage = trimmed;
    session.lastInfoMessageTime = now;
    return false;
  }
  
  // 通常のメッセージは重複チェックしない
  return false;
}