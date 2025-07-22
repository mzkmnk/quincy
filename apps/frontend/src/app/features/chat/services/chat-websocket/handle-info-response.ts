/**
 * 情報レスポンスを処理する
 * @param data 情報データ
 * @param sessionId 現在のセッションID
 * @param onHandleInfo 情報処理コールバック
 */
import { chatStateManager } from '../../../../core/store/chat/actions';

export function handleInfoResponse(
  data: { sessionId: string; message: string; type?: string },
  sessionId: string,
  onHandleInfo: (data: { sessionId: string; message: string; type?: string }) => void
): void {
  // Filter by session ID
  if (data.sessionId === sessionId) {
    console.log('Received Q info for current session:', data);

    // プロンプト準備完了メッセージの検出
    if (data.type === 'status' && data.message === 'prompt-ready') {
      console.log('Prompt ready received, setting chat state to idle');
      // プロンプト準備完了時はアイドル状態に戻す（送信可能）
      chatStateManager.setIdle();
      return; // プロンプト準備完了は通常のinfo処理をスキップ
    }

    onHandleInfo(data);
  }
}
