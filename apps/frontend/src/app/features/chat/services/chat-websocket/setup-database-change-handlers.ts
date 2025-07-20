/**
 * WebSocketデータベース変更イベントハンドラーのセットアップ
 */

import { Injectable, inject } from '@angular/core';

import { WebSocketService } from '../../../../core/services/websocket.service';
import {
  isDatabaseChangeEventWithChat,
  type WebSocketMessage,
} from '../../../../core/types/websocket.types';

import { handleDatabaseChangeNotification } from './handle-database-change-notification';

@Injectable({
  providedIn: 'root',
})
export class DatabaseChangeHandlerService {
  private websocketService = inject(WebSocketService);

  /**
   * データベース変更イベントハンドラーをセットアップ
   */
  setupHandlers(): void {
    // database-changed-with-chatイベントの処理
    this.websocketService.on('database-changed-with-chat', (message: WebSocketMessage) => {
      if (isDatabaseChangeEventWithChat(message)) {
        console.log('Database change event received:', message);
        handleDatabaseChangeNotification(message);
      }
    });
  }

  /**
   * イベントハンドラーをクリーンアップ
   */
  cleanup(): void {
    this.websocketService.off('database-changed-with-chat');
  }
}
