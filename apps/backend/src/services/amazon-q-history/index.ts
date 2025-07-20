/**
 * Amazon Q History サービス
 * 1ファイル1関数アーキテクチャによる再構築
 */

import type { ConversationMetadata } from '@quincy/shared';

import type { DisplayMessage, AmazonQConversationWithHistory } from '../amazon-q-history-types';

// 分離した関数をインポート
import { isDatabaseAvailable } from './is-database-available';
import { getProjectHistory } from './get-project-history';
import { getAllProjectsHistory } from './get-all-projects-history';
import { findByConversationId } from './find-by-conversation-id';
import { getProjectHistoryDetailed } from './get-project-history-detailed';
import { getConversationStats } from './get-conversation-stats';
import { getAllProjectsHistoryDetailed } from './get-all-projects-history-detailed';

export class AmazonQHistoryService {
  /**
   * データベースの可用性を総合的にチェック
   */
  isDatabaseAvailable(): boolean {
    return isDatabaseAvailable();
  }

  /**
   * プロジェクトの会話履歴を取得
   */
  async getProjectHistory(projectPath: string): Promise<AmazonQConversationWithHistory | null> {
    return getProjectHistory(projectPath);
  }

  /**
   * 全プロジェクトの会話メタデータを取得
   */
  async getAllProjectsHistory(): Promise<ConversationMetadata[]> {
    return getAllProjectsHistory();
  }

  /**
   * 特定のconversation_idで履歴を検索
   */
  async findByConversationId(
    conversationId: string
  ): Promise<{ projectPath: string; conversation: AmazonQConversationWithHistory } | null> {
    return findByConversationId(conversationId);
  }

  /**
   * プロジェクトの詳細履歴を取得してUI表示用に変換
   */
  async getProjectHistoryDetailed(projectPath: string): Promise<DisplayMessage[]> {
    return getProjectHistoryDetailed(projectPath);
  }

  /**
   * 会話ターンの統計情報を取得
   */
  async getConversationStats(projectPath: string): Promise<{
    totalEntries: number;
    totalTurns: number;
    averageToolUsesPerTurn: number;
    totalToolUses: number;
  } | null> {
    return getConversationStats(projectPath);
  }

  /**
   * 全プロジェクトの履歴をhistoryデータ付きで取得
   */
  async getAllProjectsHistoryDetailed(): Promise<
    {
      projectPath: string;
      conversation_id: string;
      hasHistoryData: boolean;
      messageCount: number;
      turnCount: number;
      lastUpdated: Date;
      model: string;
    }[]
  > {
    return getAllProjectsHistoryDetailed();
  }
}

// 個別関数のエクスポート（必要に応じて直接使用可能）
export {
  isDatabaseAvailable,
  getProjectHistory,
  getAllProjectsHistory,
  findByConversationId,
  getProjectHistoryDetailed,
  getConversationStats,
  getAllProjectsHistoryDetailed,
};
