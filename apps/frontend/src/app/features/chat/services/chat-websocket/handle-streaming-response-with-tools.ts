/**
 * ツール情報対応ストリーミングレスポンス処理
 */

import { ToolList, isValidToolList } from '../../../../core/types/tool-display.types';

/**
 * ツール情報を含むレスポンスデータの型定義
 */
interface StreamingResponseData {
  sessionId: string;
  data: string;
  tools?: ToolList;
  hasToolContent?: boolean;
}

/**
 * ツール情報対応ストリーミングレスポンスハンドラー
 *
 * @param data レスポンスデータ
 * @param sessionId 現在のセッションID
 * @param onHandleStreaming ストリーミング処理コールバック
 */
export function handleStreamingResponseWithTools(
  data: StreamingResponseData,
  sessionId: string,
  onHandleStreaming: (content: string, tools?: ToolList, hasToolContent?: boolean) => void
): void {
  // セッションIDによるフィルタリング
  if (data.sessionId !== sessionId) {
    return;
  }

  console.log('Received Q response with tools for current session:', data);

  // データの安全な抽出
  const content = data.data || '';

  // ツール情報の検証と抽出
  let tools: ToolList | undefined;
  let hasToolContent: boolean;

  if (data.tools && isValidToolList(data.tools)) {
    tools = data.tools;
    hasToolContent = data.hasToolContent !== undefined ? data.hasToolContent : tools.length > 0;
  } else {
    tools = undefined;
    hasToolContent = false;
  }

  // ストリーミング処理コールバック実行
  onHandleStreaming(content, tools, hasToolContent);
}
