import { Socket } from 'socket.io-client';

/**
 * WebSocketイベントリスナーを削除する
 * @param socket Socket接続
 * @param event イベント名
 * @param callback コールバック関数（指定しない場合は全て削除）
 */
export function off<T = unknown>(
  socket: Socket | null,
  event: string,
  callback?: (data: T) => void
): void {
  if (socket) {
    socket.off(event, callback);
  }
}