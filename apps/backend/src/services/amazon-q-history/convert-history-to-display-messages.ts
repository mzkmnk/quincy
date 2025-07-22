/**
 * Amazon Q historyデータをDisplayMessage配列に変換
 */

import type { DisplayMessage } from '@quincy/shared';
import { generateMessageId } from '../../utils/id-generator';

/**
 * Amazon Q SQLite3のhistoryフィールドからDisplayMessage配列を生成
 */
export function convertHistoryToDisplayMessages(history: any[]): DisplayMessage[] {
  if (!Array.isArray(history)) {
    return [];
  }

  const displayMessages: DisplayMessage[] = [];

  try {
    for (const turn of history) {
      if (!Array.isArray(turn)) {
        continue;
      }

      // 各ターンの最初の要素を処理（主要なメッセージ）
      const primaryMessage = turn[0];
      if (!primaryMessage?.content) {
        continue;
      }

      const content = primaryMessage.content;

      // Prompt (ユーザーメッセージ)
      if (content.Prompt) {
        displayMessages.push({
          id: generateMessageId(),
          type: 'user',
          content: content.Prompt.prompt,
          timestamp: new Date(),
        });
      }

      // ToolUse (AIのツール使用)
      if (content.ToolUse) {
        const toolNames = content.ToolUse.tool_uses?.map((tool: any) => tool.name) || [];
        
        displayMessages.push({
          id: generateMessageId(),
          type: 'assistant',
          content: content.ToolUse.content || '',
          timestamp: new Date(),
          metadata: {
            toolsUsed: content.ToolUse.tool_uses || [],
            messageId: content.ToolUse.message_id,
          },
        });
      }

      // ToolUseResults (ツール実行結果 - 通常は表示しない)
      if (content.ToolUseResults) {
        // ツール実行結果は通常UIには表示しないが、
        // デバッグ情報として必要な場合はここで処理
        // 現在は無視
      }

      // Response (AIの最終応答)
      if (content.Response) {
        displayMessages.push({
          id: generateMessageId(),
          type: 'assistant',
          content: content.Response.content,
          timestamp: new Date(),
          metadata: {
            messageId: content.Response.message_id,
          },
        });
      }

      // CancelledToolUses (キャンセルされたツール使用)
      if (content.CancelledToolUses) {
        displayMessages.push({
          id: generateMessageId(),
          type: 'assistant',
          content: content.CancelledToolUses.prompt || 'ツール使用がキャンセルされました',
          timestamp: new Date(),
        });
      }
    }

    return displayMessages;
  } catch (error) {
    console.error('History conversion error:', error);
    return [{
      id: generateMessageId(),
      type: 'assistant',
      content: '履歴の変換中にエラーが発生しました',
      timestamp: new Date(),
    }];
  }
}