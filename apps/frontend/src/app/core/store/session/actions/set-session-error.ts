import { sessionState } from '../session.state';

/**
 * セッションエラーを設定する
 * @param error エラーメッセージ（nullの場合はエラーをクリア）
 */
export function setSessionError(error: string | null): void {
  sessionState.update(state => ({
    ...state,
    sessionError: error,
    sessionStarting: false
  }));
}