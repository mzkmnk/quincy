/**
 * 通知を既読としてマークするアクション
 */

import { chatState } from '../chat.state';

export function markNotificationAsRead(): void {
  chatState.update(state => ({
    ...state,
    latestChatNotification: state.latestChatNotification
      ? { ...state.latestChatNotification, isRead: true }
      : null,
  }));
}
