/**
 * Amazon Q History Transformer
 * 1ファイル1関数アーキテクチャによる再構築
 */

import type { HistoryData, ConversationTurn } from '../amazon-q-history-types';

// 分離した関数をインポート
import { groupConversationTurns } from './group-conversation-turns';
import { createConversationTurn } from './create-conversation-turn';
import { extractUserMessage } from './extract-user-message';
import { extractAiThinking } from './extract-ai-thinking';
import { extractAiResponse } from './extract-ai-response';
import { extractMetadata } from './extract-metadata';
import { extractEnvironmentInfo } from './extract-environment-info';
import { extractToolsUsed } from './extract-tools-used';
import { extractMessageIds } from './extract-message-ids';
import { isValidHistoryData } from './is-valid-history-data';
import { validateHistoryEntries } from './validate-history-entries';
import { normalizeHistoryData } from './normalize-history-data';
import { countPromptEntries } from './count-prompt-entries';
import { getTransformationStats } from './get-transformation-stats';

export class HistoryTransformer {
  /**
   * historyデータを会話ターンにグループ化
   * Responseが来るまでを1つのターンとして処理
   */
  groupConversationTurns(historyData: HistoryData): ConversationTurn[] {
    return groupConversationTurns(historyData);
  }

  /**
   * historyデータが有効かチェック
   * 直接配列形式とネストされたオブジェクト形式の両方をサポート
   */
  isValidHistoryData(data: unknown): data is HistoryData {
    return isValidHistoryData(data);
  }

  /**
   * 配列形式のhistoryデータをHistoryData形式に正規化
   */
  normalizeHistoryData(data: unknown): HistoryData {
    return normalizeHistoryData(data);
  }

  /**
   * Promptエントリの数をカウント（実際のユーザーメッセージ数）
   */
  countPromptEntries(historyData: HistoryData): number {
    return countPromptEntries(historyData);
  }

  /**
   * 変換の統計情報を取得
   */
  getTransformationStats(historyData: HistoryData): {
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  } {
    return getTransformationStats(historyData);
  }
}

// 個別関数のエクスポート（必要に応じて直接使用可能）
export {
  groupConversationTurns,
  createConversationTurn,
  extractUserMessage,
  extractAiThinking,
  extractAiResponse,
  extractMetadata,
  extractEnvironmentInfo,
  extractToolsUsed,
  extractMessageIds,
  isValidHistoryData,
  validateHistoryEntries,
  normalizeHistoryData,
  countPromptEntries,
  getTransformationStats
};