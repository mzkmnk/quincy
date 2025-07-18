/**
 * ストリーミングレスポンスを処理する
 * @param data レスポンスデータ
 * @param sessionId 現在のセッションID
 * @param onHandleStreaming ストリーミング処理コールバック
 */
export function handleStreamingResponse(
  data: { sessionId: string; data: string },
  sessionId: string,
  onHandleStreaming: (content: string) => void
): void {
  // Filter by session ID to prevent duplicate messages
  if (data.sessionId === sessionId) {
    console.log('Received Q response for current session:', data);
    onHandleStreaming(data.data);
  }
}