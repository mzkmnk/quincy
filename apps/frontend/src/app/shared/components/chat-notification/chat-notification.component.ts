/**
 * リアルタイムチャット通知コンポーネント
 */

import { Component, ChangeDetectionStrategy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';

import { latestChatNotification, hasUnreadNotification } from '../../../core/store/chat/chat.state';
import { markNotificationAsRead } from '../../../core/store/chat/actions';

@Component({
  selector: 'app-chat-notification',
  imports: [CommonModule],
  template: `
    @if (hasUnreadNotification()) {
      <div class="chat-notification" [class.show]="hasUnreadNotification()">
        <div class="notification-header">
          <span class="notification-title">新しいチャット</span>
          <button class="notification-close" (click)="markAsRead()" aria-label="通知を閉じる">
            ×
          </button>
        </div>

        @if (notification(); as notif) {
          <div class="notification-content">
            <div class="user-message"><strong>あなた:</strong> {{ notif.userMessage }}</div>
            <div class="ai-response"><strong>AI:</strong> {{ notif.aiResponse }}</div>
            <div class="notification-info">
              <span class="timestamp">{{ formatTimestamp(notif.timestamp) }}</span>
              <span class="change-type">{{ formatChangeType(notif.changeInfo.changeType) }}</span>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [
    `
      .chat-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease-in-out;
      }

      .chat-notification.show {
        transform: translateX(0);
        opacity: 1;
      }

      .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        border-bottom: 1px solid #e0e0e0;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
      }

      .notification-title {
        font-weight: 600;
        color: #333;
      }

      .notification-close {
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #666;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
      }

      .notification-close:hover {
        background: #e0e0e0;
      }

      .notification-content {
        padding: 16px;
      }

      .user-message,
      .ai-response {
        margin-bottom: 8px;
        font-size: 14px;
        line-height: 1.4;
      }

      .user-message strong,
      .ai-response strong {
        color: #333;
      }

      .notification-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        font-size: 12px;
        color: #666;
      }

      .timestamp {
        font-style: italic;
      }

      .change-type {
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 500;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatNotificationComponent {
  // Signals
  notification = latestChatNotification;
  hasUnreadNotification = hasUnreadNotification;

  constructor() {
    // 自動非表示効果
    effect(() => {
      if (this.hasUnreadNotification()) {
        // 5秒後に自動で既読にする
        setTimeout(() => {
          this.markAsRead();
        }, 5000);
      }
    });
  }

  markAsRead(): void {
    markNotificationAsRead();
  }

  formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  }

  formatChangeType(changeType: 'add' | 'modified' | 'deleted'): string {
    const typeMap = {
      add: '追加',
      modified: '更新',
      deleted: '削除',
    };
    return typeMap[changeType] || changeType;
  }
}
