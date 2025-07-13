
import Database from 'better-sqlite3'
import path from 'path'
import { homedir } from 'os'
import { existsSync } from 'fs'
import { logger } from '../utils/logger'
import type { AmazonQConversation, ConversationMetadata } from '@quincy/shared'

export class AmazonQHistoryService {
  private dbPath: string

  constructor() {
    // Amazon Q CLIのデータベースパス
    this.dbPath = path.join(homedir(), 'Library', 'Application Support', 'amazon-q', 'data.sqlite3')
    logger.info(`Amazon Q database path: ${this.dbPath}`)
  }

  /**
   * プロジェクトの会話履歴を取得
   */
  async getProjectHistory(projectPath: string): Promise<AmazonQConversation | null> {
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

        const conversation: AmazonQConversation = JSON.parse(result.value)
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
            const conversation: AmazonQConversation = JSON.parse(row.value)
            
            metadata.push({
              projectPath: row.key,
              conversation_id: conversation.conversation_id,
              messageCount: conversation.transcript?.length || 0,
              lastUpdated: new Date(), // SQLiteには更新日時がないため現在時刻を使用
              model: conversation.model
            })
          } catch (parseError) {
            logger.warn('Failed to parse conversation data', { key: row.key, error: parseError })
          }
        }

        logger.info(`Successfully retrieved ${metadata.length} conversation metadata entries`)
        return metadata.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
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
  async findByConversationId(conversationId: string): Promise<{ projectPath: string; conversation: AmazonQConversation } | null> {
    try {
      const db = new Database(this.dbPath, { readonly: true })
      
      const stmt = db.prepare('SELECT key, value FROM conversations')
      const results = stmt.all() as { key: string; value: string }[]
      
      db.close()

      for (const row of results) {
        try {
          const conversation: AmazonQConversation = JSON.parse(row.value)
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
}