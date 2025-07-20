/**
 * 情報レスポンスを処理する
 * @param data 情報データ
 * @param sessionId 現在のセッションID
 * @param onHandleInfo 情報処理コールバック
 */
export function handleInfoResponse(
  data: { sessionId: string; message: string; type?: string },
  sessionId: string,
  onHandleInfo: (data: { sessionId: string; message: string; type?: string }) => void
): void {
  // Filter by session ID
  if (data.sessionId === sessionId) {
    console.log('Received Q info for current session:', data);
    onHandleInfo(data);
  }
}
