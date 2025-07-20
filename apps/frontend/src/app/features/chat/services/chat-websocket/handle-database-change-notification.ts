/**
 * WebSocketデータベース変更通知をチャット状態に統合する処理
 */

import {
  handleDatabaseChangeWithChat,
  type DatabaseChangeCallback,
} from '../../../../core/services/websocket/database-change';
import {
  updateLatestChatNotification,
  updateDatabaseChangeInfo,
} from '../../../../core/store/chat/actions';
import type { DatabaseChangeEventWithChat } from '../../../../core/types/websocket.types';

/**
 * WebSocketから受信したデータベース変更イベントを処理して状態を更新
 */
export function handleDatabaseChangeNotification(eventData: DatabaseChangeEventWithChat): void {
  const callback: DatabaseChangeCallback = notification => {
    if (notification.type === 'LATEST_CHAT_UPDATED') {
      // チャット内容がある場合は通知を更新
      updateLatestChatNotification({
        userMessage: notification.payload.userMessage || '',
        aiResponse: notification.payload.aiResponse || '',
        timestamp: notification.payload.timestamp?.toString() || '',
        turnId: notification.payload.turnId || '',
        changeInfo: notification.payload.changeInfo!,
      });
    } else if (notification.type === 'DATABASE_CHANGED_NO_CHAT') {
      // チャット内容がない場合はデータベース変更情報のみ更新
      updateDatabaseChangeInfo({
        filePath: notification.payload.filePath!,
        changeType: notification.payload.changeType!,
        timestamp: notification.payload.timestamp as Date,
      });
    }
  };

  // WebSocket処理関数を呼び出し
  handleDatabaseChangeWithChat(eventData, callback);
}
