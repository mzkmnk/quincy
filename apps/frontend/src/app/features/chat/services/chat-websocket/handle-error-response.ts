/**
 * エラーレスポンスを処理する
 * @param data エラーデータ
 * @param sessionId 現在のセッションID
 * @param shouldDisplayError エラー表示判定関数
 * @param onHandleError エラー処理コールバック
 */
export function handleErrorResponse(
  data: { sessionId: string; error: string },
  sessionId: string,
  shouldDisplayError: (error: string) => boolean,
  onHandleError: (error: string) => void
): void {
  // Filter by session ID
  if (data.sessionId === sessionId) {
    console.error('Received Q error for current session:', data);

    // 意味のあるエラーのみ表示
    if (shouldDisplayError(data.error)) {
      onHandleError(data.error);
    }
  }
}
