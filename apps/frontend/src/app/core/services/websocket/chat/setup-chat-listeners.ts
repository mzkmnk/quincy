import { Socket } from 'socket.io-client';
import { on } from '../connection/on';
import { ChatListeners } from '../types';

/**
 * チャット関連のイベントリスナーを設定する
 * @param socket Socket接続
 * @param listeners チャットリスナー
 */
export function setupChatListeners(
  socket: Socket | null,
  listeners: ChatListeners
): void {
  on(socket, 'q:response', listeners.onResponse);
  on(socket, 'q:error', listeners.onError);
  on(socket, 'q:info', listeners.onInfo);
  on(socket, 'q:complete', listeners.onComplete);
}