/**
 * Amazon Q History サービス（SQLite3機能削除版）
 * WebSocketハンドラーとの互換性を保つため最小限の実装を残す
 */

// 型定義のみエクスポート（実装なし）
export class AmazonQHistoryService {
  /**
   * データベースの可用性をチェック（常にfalseを返す）
   */
  isDatabaseAvailable(): boolean {
    return false;
  }

  /**
   * プロジェクトの会話履歴を取得（常にnullを返す）
   */
  async getProjectHistory(): Promise<null> {
    return null;
  }

  /**
   * 全プロジェクトの会話メタデータを取得（常に空配列を返す）
   */
  async getAllProjectsHistory(): Promise<unknown[]> {
    return [];
  }

  /**
   * 特定のconversation_idで履歴を検索（常にnullを返す）
   */
  async findByConversationId(): Promise<null> {
    return null;
  }

  /**
   * プロジェクトの詳細履歴を取得（常に空配列を返す）
   */
  async getProjectHistoryDetailed(): Promise<unknown[]> {
    return [];
  }

  /**
   * 会話ターンの統計情報を取得（常にnullを返す）
   */
  async getConversationStats(): Promise<null> {
    return null;
  }

  /**
   * 全プロジェクトの履歴をhistoryデータ付きで取得（常に空配列を返す）
   */
  async getAllProjectsHistoryDetailed(): Promise<unknown[]> {
    return [];
  }
}

// SQLite3関連の機能は削除されました
// WebSocketハンドラーとの互換性のため空の実装を残しています
