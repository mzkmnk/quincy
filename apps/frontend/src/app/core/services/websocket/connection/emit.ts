import { Socket } from 'socket.io-client';

/**
 * WebSocketイベントを送信する
 * @param socket Socket接続
 * @param event イベント名
 * @param data 送信データ
 */
export function emit<T = unknown>(
  socket: Socket | null,
  event: string,
  data?: T
): void {
  if (socket?.connected) {
    socket.emit(event, data);
  }
}