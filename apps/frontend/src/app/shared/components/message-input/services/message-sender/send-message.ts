import { ElementRef } from '@angular/core';
import { MessageService } from 'primeng/api';

import { WebSocketService } from '../../../../../core/services/websocket.service';
import { AppStore } from '../../../../../core/store/app.state';

/**
 * メッセージを送信可能かどうかを判定する
 * @param messageText メッセージテキスト
 * @param sending 送信中かどうか
 * @returns 送信可能かどうか
 */
export function canSendMessage(messageText: string, sending: boolean): boolean {
  return messageText.trim().length > 0 && !sending;
}

/**
 * メッセージを送信する
 * @param messageText メッセージテキスト
 * @param appStore アプリストア
 * @param websocket WebSocketサービス
 * @param messageService メッセージサービス
 * @param messageTextarea メッセージテキストエリア
 * @param sendingSignal 送信中状態のsignal
 * @param messageTextSignal メッセージテキストのsignal
 * @param messageSentEmitter メッセージ送信イベントエミッター
 * @returns Promise<void>
 */
export async function sendMessage(
  messageText: string,
  appStore: AppStore,
  websocket: WebSocketService,
  messageService: MessageService,
  messageTextarea: ElementRef<HTMLTextAreaElement> | null,
  sendingSignal: { set: (value: boolean) => void },
  messageTextSignal: { set: (value: string) => void },
  messageSentEmitter: { emit: (data: { content: string }) => void }
): Promise<void> {
  const content = messageText.trim();
  const currentSession = appStore.currentQSession();

  if (!currentSession) {
    console.error('No active session to send message to');
    return;
  }

  sendingSignal.set(true);

  try {
    console.log('Sending message to Amazon Q:', content);

    // Emit message sent event for parent component to handle
    messageSentEmitter.emit({ content });

    // Send message to Amazon Q CLI via WebSocket
    await websocket.sendQMessage(currentSession.sessionId, content);

    // Clear input
    messageTextSignal.set('');

    // Reset textarea height
    if (messageTextarea) {
      messageTextarea.nativeElement.style.height = 'auto';
    }
  } catch (error) {
    console.error('Failed to send message:', error);
    messageService.add({
      severity: 'error',
      summary: 'エラー',
      detail: 'メッセージの送信に失敗しました',
      life: 5000,
    });
  } finally {
    sendingSignal.set(false);
  }
}
