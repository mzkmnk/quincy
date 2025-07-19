/**
 * Amazon Q Message Formatter
 * 1ファイル1関数アーキテクチャによる再構築
 */

import type {
  ConversationTurn,
  DisplayMessage,
  EnvironmentState,
  ToolUse,
} from '../amazon-q-history-types';

// 分離した関数をインポート
import { convertToDisplayMessages } from './convert-to-display-messages';
import { formatUserMessage } from './format-user-message';
import { formatThinkingMessages } from './format-thinking-messages';
import { formatAiResponse } from './format-ai-response';
import { formatThinkingContent } from './format-thinking-content';
import { getToolsUsedInThinkingStep } from './get-tools-used-in-thinking-step';
import { formatEnvironmentInfo } from './format-environment-info';
import { formatToolsUsed } from './format-tools-used';
import { formatStats } from './format-stats';
import { truncateContent } from './truncate-content';
import { formatMarkdown } from './format-markdown';
import { filterMessages } from './filter-messages';

export class MessageFormatter {
  /**
   * ConversationTurnをDisplayMessage配列に変換
   */
  convertToDisplayMessages(turns: ConversationTurn[]): DisplayMessage[] {
    return convertToDisplayMessages(turns);
  }

  /**
   * 環境情報を読みやすい形式に整形
   */
  formatEnvironmentInfo(environmentInfo: EnvironmentState): string {
    return formatEnvironmentInfo(environmentInfo);
  }

  /**
   * ツール使用情報を読みやすい形式に整形
   */
  formatToolsUsed(toolsUsed: ToolUse[]): string {
    return formatToolsUsed(toolsUsed);
  }

  /**
   * 統計情報を整形
   */
  formatStats(stats: {
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  }): string {
    return formatStats(stats);
  }

  /**
   * 長いコンテンツを適切に切り詰める
   */
  truncateContent(content: string, maxLength: number = 1000): string {
    return truncateContent(content, maxLength);
  }

  /**
   * マークダウン形式の簡易サポート
   */
  formatMarkdown(content: string): string {
    return formatMarkdown(content);
  }

  /**
   * 表示設定に基づいてメッセージをフィルタリング
   */
  filterMessages(
    messages: DisplayMessage[],
    options: {
      showThinking?: boolean;
      showEnvironmentInfo?: boolean;
      showToolsUsed?: boolean;
    }
  ): DisplayMessage[] {
    return filterMessages(messages, options);
  }
}

// 個別関数のエクスポート（必要に応じて直接使用可能）
export {
  convertToDisplayMessages,
  formatUserMessage,
  formatThinkingMessages,
  formatAiResponse,
  formatThinkingContent,
  getToolsUsedInThinkingStep,
  formatEnvironmentInfo,
  formatToolsUsed,
  formatStats,
  truncateContent,
  formatMarkdown,
  filterMessages,
};
