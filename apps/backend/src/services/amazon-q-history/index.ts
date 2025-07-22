/**
 * Amazon Q History サービス
 * SQLite3データベースから履歴情報を取得
 */

import type { ConversationMetadata, DisplayMessage } from '@quincy/shared';
import type { AmazonQConversationWithHistory } from '../amazon-q-history-types';

// 分離した関数をインポート
import { isDatabaseAvailable } from './is-database-available';
import { getAllProjectsHistory } from './get-all-projects-history';
import { getProjectHistory } from './get-project-history';
import { getProjectHistoryDetailed } from './get-project-history-detailed';

export class AmazonQHistoryService {
  /**
   * データベースの可用性をチェック
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
   * 特定のconversation_idで履歴を検索（未実装）
   */
  async findByConversationId(): Promise<null> {
    return null;
  }

  /**
   * プロジェクトの詳細履歴を取得
   */
  async getProjectHistoryDetailed(projectPath: string): Promise<DisplayMessage[]> {
    return getProjectHistoryDetailed(projectPath);
  }

  /**
   * 会話ターンの統計情報を取得（未実装）
   */
  async getConversationStats(projectPath: string): Promise<null> {
    // 未実装のためnullを返す
    return null;
  }

  /**
   * 全プロジェクトの履歴をhistoryデータ付きで取得（未実装）
   */
  async getAllProjectsHistoryDetailed(): Promise<unknown[]> {
    return [];
  }
}

// 個別関数のエクスポート
export {
  isDatabaseAvailable,
  getAllProjectsHistory,
  getProjectHistory,
  getProjectHistoryDetailed,
};
