/**
 * 完了レスポンスを処理する
 * @param data 完了データ
 * @param sessionId 現在のセッションID
 * @param onHandleCompletion 完了処理コールバック
 */
export function handleCompletionResponse(
  data: { sessionId: string },
  sessionId: string,
  onHandleCompletion: () => void
): void {
  // Filter by session ID
  if (data.sessionId === sessionId) {
    console.log('Q session completed for current session:', data);
    onHandleCompletion();
  }
}
