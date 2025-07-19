import type { AmazonQSession } from '../../../core/types/amazon-q.types';

/**
 * セッションが無効かどうかを判定する
 * @param sessionError セッションエラー
 * @param currentQSession 現在のQセッション
 * @returns セッションが無効かどうか
 */
export function isSessionDisabled(
  sessionError: string | null,
  currentQSession: AmazonQSession | null
): boolean {
  return !!sessionError || !currentQSession;
}

/**
 * チャットが可能かどうかを判定する
 * @param isActiveChat アクティブチャット状態
 * @param sessionError セッションエラー
 * @param currentQSession 現在のQセッション
 * @returns チャットが可能かどうか
 */
export function canChat(
  isActiveChat: boolean,
  sessionError: string | null,
  currentQSession: AmazonQSession | null
): boolean {
  return isActiveChat && !isSessionDisabled(sessionError, currentQSession);
}

/**
 * セッション無効化の理由を取得する
 * @param sessionError セッションエラー
 * @param currentQSession 現在のQセッション
 * @returns 無効化の理由
 */
export function getDisabledReason(
  sessionError: string | null,
  currentQSession: AmazonQSession | null
): string {
  if (sessionError) {
    return sessionError;
  }
  if (!currentQSession) {
    return 'No active Amazon Q session. Please start a new project session.';
  }
  return 'Chat is temporarily unavailable.';
}
