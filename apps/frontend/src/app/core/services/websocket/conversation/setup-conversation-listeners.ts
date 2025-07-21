/**
 * conversation関連のWebSocketリスナーを設定
 */

import { Socket } from 'socket.io-client';

export interface ConversationListeners {
  onConversationReady: (data: {
    sessionId: string;
    conversationId: string;
    projectPath: string;
  }) => void;
  onTranscriptUpdate: (data: {
    conversationId: string;
    newMessages: Array<{
      role: 'user' | 'assistant';
      content: Array<{ text: string }>;
    }>;
    totalMessageCount: number;
  }) => void;
  onToolActivity: (data: { conversationId: string; tools: string[]; message: string }) => void;
  onConversationTimeout: (data: {
    sessionId?: string;
    conversationId?: string;
    error: string;
  }) => void;
}

/**
 * conversation関連のWebSocketリスナーを設定
 * @param socket Socket.IOインスタンス
 * @param listeners リスナーコールバック
 */
export function setupConversationListeners(
  socket: Socket | null,
  listeners: ConversationListeners
): void {
  if (!socket) {
    console.warn('Socket is not available for conversation listeners setup');
    return;
  }

  // conversation:ready - conversation_id確定通知
  socket.on('conversation:ready', data => {
    console.log('Conversation ready:', data);
    listeners.onConversationReady(data);
  });

  // conversation:transcript-update - 新規メッセージ通知
  socket.on('conversation:transcript-update', data => {
    console.log('Transcript update:', data);
    listeners.onTranscriptUpdate(data);
  });

  // conversation:tool-activity - ツール使用通知
  socket.on('conversation:tool-activity', data => {
    console.log('Tool activity:', data);
    listeners.onToolActivity(data);
  });

  // conversation:timeout - タイムアウト通知
  socket.on('conversation:timeout', data => {
    console.log('Conversation timeout:', data);
    listeners.onConversationTimeout(data);
  });
}

/**
 * conversation関連のWebSocketリスナーを削除
 * @param socket Socket.IOインスタンス
 */
export function removeConversationListeners(socket: Socket | null): void {
  if (!socket) {
    console.warn('Socket is not available for conversation listeners removal');
    return;
  }

  socket.off('conversation:ready');
  socket.off('conversation:transcript-update');
  socket.off('conversation:tool-activity');
  socket.off('conversation:timeout');

  console.log('Conversation listeners removed');
}
