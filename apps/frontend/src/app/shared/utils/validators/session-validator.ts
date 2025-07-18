/**
 * セッションIDの妥当性を検証する
 * @param sessionId 検証するセッションID
 * @returns 検証結果（trueの場合は有効）
 */
export function isValidSessionId(sessionId: string): boolean {
  return /^q_session_[a-zA-Z0-9]+$/.test(sessionId);
}