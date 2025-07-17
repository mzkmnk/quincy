
import Database from 'better-sqlite3'
import path from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import type { ConversationMetadata } from '@quincy/shared'
import { 
  HistoryData,
  ConversationTurn,
  DisplayMessage,
  AmazonQConversationWithHistory
} from './amazon-q-history-types'
import { HistoryTransformer } from './amazon-q-history-transformer'
import { MessageFormatter } from './amazon-q-message-formatter'

export class AmazonQHistoryService {
  private dbPath: string
  private historyTransformer: HistoryTransformer
  private messageFormatter: MessageFormatter

  constructor() {
    // Amazon Q CLIのデータベースパス
    this.dbPath = path.join(homedir(), 'Library', 'Application Support', 'amazon-q', 'data.sqlite3')
    this.historyTransformer = new HistoryTransformer()
    this.messageFormatter = new MessageFormatter()
  }

  /**
   * プロジェクトの会話履歴を取得
   */
  async getProjectHistory(projectPath: string): Promise<AmazonQConversationWithHistory | null> {
    try {
      
      if (!this.isDatabaseAvailable()) {
        throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。')
      }

      const db = new Database(this.dbPath, { readonly: true })
      
      try {
        const stmt = db.prepare('SELECT value FROM conversations WHERE key = ?')
        const result = stmt.get(projectPath) as { value: string } | undefined
        
        if (!result) {
          return null
        }

        const conversation: AmazonQConversationWithHistory = JSON.parse(result.value)
        return conversation
      } finally {
        db.close()
      }
    } catch (error) {
      
      // エラーを再スローして上位コンポーネントでキャッチできるようにする
      throw error
    }
  }

  /**
   * 全プロジェクトの会話メタデータを取得
   */
  async getAllProjectsHistory(): Promise<ConversationMetadata[]> {
    try {
      
      if (!this.isDatabaseAvailable()) {
        throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。')
      }
      
      const db = new Database(this.dbPath, { readonly: true })
      
      try {
        const stmt = db.prepare('SELECT key, value FROM conversations')
        const results = stmt.all() as { key: string; value: string }[]
        
        const metadata: ConversationMetadata[] = []

        for (const row of results) {
          try {
            const conversation: AmazonQConversationWithHistory = JSON.parse(row.value)
            
            // historyデータからユーザーメッセージ数を計算（Promptエントリ数ベース）
            let messageCount = 0
            if (conversation.history && this.historyTransformer.isValidHistoryData(conversation.history)) {
              const normalizedHistory = this.historyTransformer.normalizeHistoryData(conversation.history)
              messageCount = this.historyTransformer.countPromptEntries(normalizedHistory)
            }
            
            metadata.push({
              projectPath: row.key,
              conversation_id: conversation.conversation_id,
              messageCount,
              lastUpdated: new Date(), // SQLiteには更新日時がないため現在時刻を使用
              model: conversation.model
            })
          } catch (parseError) {
          }
        }

        // プロジェクトパスでアルファベット順にソート（安定した並び替え）
        return metadata.sort((a, b) => a.projectPath.localeCompare(b.projectPath))
      } finally {
        db.close()
      }
    } catch (error) {
      
      // エラーを再スローして上位コンポーネントでキャッチできるようにする
      throw error
    }
  }

  /**
   * データベースの可用性を総合的にチェック
   */
  isDatabaseAvailable(): boolean {
    try {
      
      // ファイルの存在確認
      if (!existsSync(this.dbPath)) {
        return false
      }
      
      const db = new Database(this.dbPath, { readonly: true })
      
      // 実際にconversationsテーブルが存在するか確認
      const tableExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'"
      ).get()
      
      if (!tableExists) {
        db.close()
        return false
      }
      
      
      // テーブルに実際にアクセスできるかテスト
      try {
        const result = db.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number }
      } catch (accessError) {
        db.close()
        return false
      }
      
      db.close()
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 特定のconversation_idで履歴を検索
   */
  async findByConversationId(conversationId: string): Promise<{ projectPath: string; conversation: AmazonQConversationWithHistory } | null> {
    try {
      const db = new Database(this.dbPath, { readonly: true })
      
      const stmt = db.prepare('SELECT key, value FROM conversations')
      const results = stmt.all() as { key: string; value: string }[]
      
      db.close()

      for (const row of results) {
        try {
          const conversation: AmazonQConversationWithHistory = JSON.parse(row.value)
          if (conversation.conversation_id === conversationId) {
            return {
              projectPath: row.key,
              conversation
            }
          }
        } catch (parseError) {
        }
      }

      return null
    } catch (error) {
      return null
    }
  }

  /**
   * プロジェクトの詳細履歴を取得してUI表示用に変換
   */
  async getProjectHistoryDetailed(projectPath: string): Promise<DisplayMessage[]> {
    try {
      
      if (!this.isDatabaseAvailable()) {
        throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。')
      }

      const db = new Database(this.dbPath, { readonly: true })
      
      try {
        const stmt = db.prepare('SELECT value FROM conversations WHERE key = ?')
        const result = stmt.get(projectPath) as { value: string } | undefined
        
        if (!result) {
          return []
        }

        const conversationData: AmazonQConversationWithHistory = JSON.parse(result.value)
        
        // historyデータが存在するかチェック
        if (!conversationData.history) {
          return []
        }

        if (!this.historyTransformer.isValidHistoryData(conversationData.history)) {
          return []
        }

        // historyデータを正規化して変換
        const normalizedHistory = this.historyTransformer.normalizeHistoryData(conversationData.history)
        const turns = this.historyTransformer.groupConversationTurns(normalizedHistory)
        const displayMessages = this.messageFormatter.convertToDisplayMessages(turns)
        
        return displayMessages
        
      } finally {
        db.close()
      }
    } catch (error) {
      
      throw error
    }
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
    try {
      const db = new Database(this.dbPath, { readonly: true })
      
      try {
        const stmt = db.prepare('SELECT value FROM conversations WHERE key = ?')
        const result = stmt.get(projectPath) as { value: string } | undefined
        
        if (!result) {
          return null
        }

        const conversationData: AmazonQConversationWithHistory = JSON.parse(result.value)
        
        if (!conversationData.history || !this.historyTransformer.isValidHistoryData(conversationData.history)) {
          return null
        }

        const normalizedHistory = this.historyTransformer.normalizeHistoryData(conversationData.history)
        return this.historyTransformer.getTransformationStats(normalizedHistory)
        
      } finally {
        db.close()
      }
    } catch (error) {
      return null
    }
  }


  /**
   * 全プロジェクトの履歴をhistoryデータ付きで取得
   */
  async getAllProjectsHistoryDetailed(): Promise<{
    projectPath: string;
    conversation_id: string;
    hasHistoryData: boolean;
    messageCount: number;
    turnCount: number;
    lastUpdated: Date;
    model: string;
  }[]> {
    try {
      
      if (!this.isDatabaseAvailable()) {
        throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。')
      }
      
      const db = new Database(this.dbPath, { readonly: true })
      
      try {
        const stmt = db.prepare('SELECT key, value FROM conversations')
        const results = stmt.all() as { key: string; value: string }[]
        
        const detailedMetadata: {
          projectPath: string;
          conversation_id: string;
          hasHistoryData: boolean;
          messageCount: number;
          turnCount: number;
          lastUpdated: Date;
          model: string;
        }[] = []

        for (const row of results) {
          try {
            const conversation: AmazonQConversationWithHistory = JSON.parse(row.value)
            
            let hasHistoryData = false
            let turnCount = 0
            let messageCount = 0
            
            if (conversation.history && this.historyTransformer.isValidHistoryData(conversation.history)) {
              hasHistoryData = true
              const normalizedHistory = this.historyTransformer.normalizeHistoryData(conversation.history)
              const turns = this.historyTransformer.groupConversationTurns(normalizedHistory)
              turnCount = turns.length
              messageCount = this.historyTransformer.countPromptEntries(normalizedHistory)
            }
            
            detailedMetadata.push({
              projectPath: row.key,
              conversation_id: conversation.conversation_id,
              hasHistoryData,
              messageCount,
              turnCount,
              lastUpdated: new Date(),
              model: conversation.model
            })
          } catch (parseError) {
          }
        }

        return detailedMetadata.sort((a, b) => a.projectPath.localeCompare(b.projectPath))
      } finally {
        db.close()
      }
    } catch (error) {
      
      throw error
    }
  }
}