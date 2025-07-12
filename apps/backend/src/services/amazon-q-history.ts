
import Database from 'better-sqlite3'
import path from 'path'
import { homedir } from 'os'
import { logger } from '../utils/logger'
import type { AmazonQConversation, ConversationMetadata } from '@quincy/shared'

export class AmazonQHistoryService {
  private dbPath: string

  constructor() {
    // Amazon Q CLIのデータベースパス
    this.dbPath = path.join(homedir(), 'Library', 'Application Support', 'amazon-q', 'data.sqlite3')
  }

  /**
   * プロジェクトの会話履歴を取得
   */
  async getProjectHistory(projectPath: string): Promise<AmazonQConversation | null> {
    try {
      logger.info(`Getting project history for: ${projectPath}`)
      
      if (!this.isDatabaseAvailable()) {
        logger.warn('Amazon Q database not available')
        return null
      }

      const db = new Database(this.dbPath, { readonly: true })
      
      const stmt = db.prepare('SELECT value FROM conversations WHERE key = ?')
      const result = stmt.get(projectPath) as { value: string } | undefined
      
      db.close()

      if (!result) {
        logger.info(`No conversation found for project: ${projectPath}`)
        return null
      }

      const conversation: AmazonQConversation = JSON.parse(result.value)
      logger.info(`Found conversation for project: ${projectPath}, ID: ${conversation.conversation_id}`)
      return conversation
    } catch (error) {
      logger.error('Failed to get project history', { projectPath, error })
      return null
    }
  }

  /**
   * 全プロジェクトの会話メタデータを取得
   */
  async getAllProjectsHistory(): Promise<ConversationMetadata[]> {
    try {
      const db = new Database(this.dbPath, { readonly: true })
      
      const stmt = db.prepare('SELECT key, value FROM conversations')
      const results = stmt.all() as { key: string; value: string }[]
      
      db.close()

      const metadata: ConversationMetadata[] = []

      for (const row of results) {
        try {
          const conversation: AmazonQConversation = JSON.parse(row.value)
          
          metadata.push({
            projectPath: row.key,
            conversation_id: conversation.conversation_id,
            messageCount: conversation.transcript.length,
            lastUpdated: new Date(), // SQLiteには更新日時がないため現在時刻を使用
            model: conversation.model
          })
        } catch (parseError) {
          logger.warn('Failed to parse conversation data', { key: row.key, error: parseError })
        }
      }

      return metadata.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime())
    } catch (error) {
      logger.error('Failed to get all projects history', error)
      return []
    }
  }

  /**
   * データベースファイルが存在するかチェック
   */
  isDatabaseAvailable(): boolean {
    try {
      const db = new Database(this.dbPath, { readonly: true })
      db.close()
      return true
    } catch (error) {
      logger.warn('Amazon Q database not available', error)
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