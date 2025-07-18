import { Socket } from 'socket.io-client';

/**
 * WebSocketイベントリスナーを設定する
 * @param socket Socket接続
 * @param event イベント名
 * @param callback コールバック関数
 */
export function on<T = unknown>(
  socket: Socket | null,
  event: string,
  callback: (data: T) => void
): void {
  if (socket) {
    socket.on(event, callback);
  }
}