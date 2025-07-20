/**
 * 最新チャット通知を更新するアクション
 */

import { chatState, type ChatNotification } from '../chat.state';

interface UpdateLatestChatNotificationPayload {
  userMessage: string;
  aiResponse: string;
  timestamp: string;
  turnId: string;
  changeInfo: {
    filePath: string;
    changeType: 'add' | 'modified' | 'deleted';
    timestamp: Date;
  };
}

export function updateLatestChatNotification(payload: UpdateLatestChatNotificationPayload): void {
  const notification: ChatNotification = {
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userMessage: payload.userMessage,
    aiResponse: payload.aiResponse,
    timestamp: payload.timestamp,
    turnId: payload.turnId,
    changeInfo: payload.changeInfo,
    isRead: false,
  };

  chatState.update(state => ({
    ...state,
    latestChatNotification: notification,
    databaseChangeInfo: {
      filePath: payload.changeInfo.filePath,
      changeType: payload.changeInfo.changeType,
      lastChange: payload.changeInfo.timestamp,
    },
  }));
}
