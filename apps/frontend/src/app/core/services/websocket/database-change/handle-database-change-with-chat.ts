/**
 * WebSocketで受信したデータベース変更イベント（チャット内容付き）を処理
 */

import type { DatabaseChangeEventWithChat } from '../../../types/websocket.types';

// コールバック関数の型定義
export type DatabaseChangeCallback = (notification: {
  type: 'LATEST_CHAT_UPDATED' | 'DATABASE_CHANGED_NO_CHAT';
  payload: {
    userMessage?: string;
    aiResponse?: string;
    timestamp?: string | Date;
    turnId?: string;
    changeInfo?: {
      filePath: string;
      changeType: 'add' | 'modified' | 'deleted';
      timestamp: Date;
    };
    filePath?: string;
    changeType?: 'add' | 'modified' | 'deleted';
  };
}) => void;

/**
 * データベース変更イベント（チャット内容付き）を処理し、適切なコールバックを実行
 */
export function handleDatabaseChangeWithChat(
  eventData: unknown,
  callback: DatabaseChangeCallback
): boolean {
  try {
    // データの基本的な検証
    if (!eventData || typeof eventData !== 'object') {
      return false;
    }

    const data = eventData as Partial<DatabaseChangeEventWithChat>;

    // 必須フィールドの検証
    if (
      data.type !== 'database-changed-with-chat' ||
      !data.filePath ||
      !data.changeType ||
      !data.timestamp
    ) {
      return false;
    }

    // 型安全な変換
    const validatedData: DatabaseChangeEventWithChat = {
      type: data.type,
      timestamp: data.timestamp,
      filePath: data.filePath,
      changeType: data.changeType,
      latestChat: data.latestChat || null,
    };

    // チャット内容が存在する場合
    if (validatedData.latestChat) {
      // チャット内容のサニタイズ
      const sanitizedChat = {
        userMessage: sanitizeString(validatedData.latestChat.userMessage),
        aiResponse: sanitizeString(validatedData.latestChat.aiResponse),
        timestamp: sanitizeString(validatedData.latestChat.timestamp),
        turnId: sanitizeString(validatedData.latestChat.turnId),
      };

      callback({
        type: 'LATEST_CHAT_UPDATED',
        payload: {
          ...sanitizedChat,
          changeInfo: {
            filePath: validatedData.filePath,
            changeType: validatedData.changeType,
            timestamp: validatedData.timestamp,
          },
        },
      });
    } else {
      // チャット内容がない場合
      callback({
        type: 'DATABASE_CHANGED_NO_CHAT',
        payload: {
          filePath: validatedData.filePath,
          changeType: validatedData.changeType,
          timestamp: validatedData.timestamp,
        },
      });
    }

    return true;
  } catch {
    // コールバックエラーをキャッチ
    return false;
  }
}

/**
 * 文字列のサニタイズとフォールバック処理
 */
function sanitizeString(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }
  return '';
}
