
import Database from 'better-sqlite3'
import path from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { logger } from '../utils/logger'
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
    logger.info(`Amazon Q database path: ${this.dbPath}`)
  }

  /**
   * プロジェクトの会話履歴を取得
   */
  async getProjectHistory(projectPath: string): Promise<AmazonQConversationWithHistory | null> {
    try {
      logger.info(`Getting project history for: ${projectPath}`)
      
      if (!this.isDatabaseAvailable()) {
        logger.warn('Amazon Q database not available for getProjectHistory')
        throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。')
      }

      const db = new Database(this.dbPath, { readonly: true })
      
      try {
        const stmt = db.prepare('SELECT value FROM conversations WHERE key = ?')
        const result = stmt.get(projectPath) as { value: string } | undefined
        
        if (!result) {
          logger.info(`No conversation found for project: ${projectPath}`)
          return null
        }

        const conversation: AmazonQConversationWithHistory = JSON.parse(result.value)
        logger.info(`Found conversation for project: ${projectPath}, ID: ${conversation.conversation_id}`)
        return conversation
      } finally {
        db.close()
      }
    } catch (error) {
      logger.error('Failed to get project history', { 
        projectPath, 
        error: error instanceof Error ? error.message : String(error),
        dbPath: this.dbPath
      })
      
      // エラーを再スローして上位コンポーネントでキャッチできるようにする
      throw error
    }
  }

  /**
   * 全プロジェクトの会話メタデータを取得
   */
  async getAllProjectsHistory(): Promise<ConversationMetadata[]> {
    try {
      logger.info('Getting all projects history')
      
      if (!this.isDatabaseAvailable()) {
        logger.warn('Database not available for getAllProjectsHistory')
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
            logger.warn('Failed to parse conversation data', { key: row.key, error: parseError })
          }
        }

        logger.info(`Successfully retrieved ${metadata.length} conversation metadata entries`)
        // プロジェクトパスでアルファベット順にソート（安定した並び替え）
        return metadata.sort((a, b) => a.projectPath.localeCompare(b.projectPath))
      } finally {
        db.close()
      }
    } catch (error) {
      logger.error('Failed to get all projects history', {
        error: error instanceof Error ? error.message : String(error),
        dbPath: this.dbPath
      })
      
      // エラーを再スローして上位コンポーネントでキャッチできるようにする
      throw error
    }
  }

  /**
   * データベースの可用性を総合的にチェック
   */
  isDatabaseAvailable(): boolean {
    try {
      logger.info(`Checking database availability at: ${this.dbPath}`)
      
      // ファイルの存在確認
      if (!existsSync(this.dbPath)) {
        logger.warn(`Database file does not exist: ${this.dbPath}`)
        return false
      }
      
      logger.info('Database file exists, testing connection...')
      const db = new Database(this.dbPath, { readonly: true })
      
      // 実際にconversationsテーブルが存在するか確認
      const tableExists = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='conversations'"
      ).get()
      
      if (!tableExists) {
        logger.warn('conversations table does not exist in Amazon Q database')
        db.close()
        return false
      }
      
      logger.info('conversations table exists, testing access...')
      
      // テーブルに実際にアクセスできるかテスト
      try {
        const result = db.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number }
        logger.info(`Database accessible, found ${result.count} conversations`)
      } catch (accessError) {
        logger.warn('Cannot access conversations table', accessError)
        db.close()
        return false
      }
      
      db.close()
      logger.info('Amazon Q database is available and accessible')
      return true
    } catch (error) {
      logger.error('Amazon Q database not available', {
        dbPath: this.dbPath,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
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
          logger.warn('Failed to parse conversation data', { key: row.key })
        }
      }

      return null
    } catch (error) {
      logger.error('Failed to find conversation by ID', error)
      return null
    }
  }

  /**
   * プロジェクトの詳細履歴を取得してUI表示用に変換
   */
  async getProjectHistoryDetailed(projectPath: string): Promise<DisplayMessage[]> {
    try {
      logger.info(`Getting detailed project history for: ${projectPath}`)
      
      if (!this.isDatabaseAvailable()) {
        logger.warn('Amazon Q database not available for getProjectHistoryDetailed')
        throw new Error('データベースにアクセスできません。Amazon Q CLIがインストールされているか確認してください。')
      }

      const db = new Database(this.dbPath, { readonly: true })
      
      try {
        const stmt = db.prepare('SELECT value FROM conversations WHERE key = ?')
        const result = stmt.get(projectPath) as { value: string } | undefined
        
        if (!result) {
          logger.info(`No conversation found for project: ${projectPath}`)
          return []
        }

        const conversationData: AmazonQConversationWithHistory = JSON.parse(result.value)
        logger.info(`Found conversation for project: ${projectPath}, ID: ${conversationData.conversation_id}`)
        
        // historyデータが存在するかチェック
        if (!conversationData.history) {
          logger.warn(`No history field found for project: ${projectPath}`, {
            availableFields: Object.keys(conversationData),
            conversationId: conversationData.conversation_id
          })
          return []
        }

        if (!this.historyTransformer.isValidHistoryData(conversationData.history)) {
          logger.warn(`Invalid history data structure for project: ${projectPath}`, {
            historyType: typeof conversationData.history,
            isArray: Array.isArray(conversationData.history),
            historyKeys: conversationData.history && typeof conversationData.history === 'object' 
              ? Object.keys(conversationData.history) 
              : 'not an object',
            conversationId: conversationData.conversation_id
          })
          return []
        }

        // historyデータを正規化して変換
        const normalizedHistory = this.historyTransformer.normalizeHistoryData(conversationData.history)
        const turns = this.historyTransformer.groupConversationTurns(normalizedHistory)
        const displayMessages = this.messageFormatter.convertToDisplayMessages(turns)
        
        logger.info(`Converted ${turns.length} conversation turns to ${displayMessages.length} display messages`)
        return displayMessages
        
      } finally {
        db.close()
      }
    } catch (error) {
      logger.error('Failed to get detailed project history', { 
        projectPath, 
        error: error instanceof Error ? error.message : String(error),
        dbPath: this.dbPath
      })
      
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
      logger.error('Failed to get conversation stats', { 
        projectPath, 
        error: error instanceof Error ? error.message : String(error)
      })
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
      logger.info('Getting all projects history with detailed information')
      
      if (!this.isDatabaseAvailable()) {
        logger.warn('Database not available for getAllProjectsHistoryDetailed')
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
            logger.warn('Failed to parse conversation data', { key: row.key, error: parseError })
          }
        }

        logger.info(`Successfully retrieved ${detailedMetadata.length} detailed conversation metadata entries`)
        return detailedMetadata.sort((a, b) => a.projectPath.localeCompare(b.projectPath))
      } finally {
        db.close()
      }
    } catch (error) {
      logger.error('Failed to get all projects history detailed', {
        error: error instanceof Error ? error.message : String(error),
        dbPath: this.dbPath
      })
      
      throw error
    }
  }
}