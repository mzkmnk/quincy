import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ErrorData,
} from '@quincy/shared';

export function sendError(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  code: string,
  message: string,
  details?: Record<string, string | number | boolean | null>
): void {
  const errorData: ErrorData = {
    code,
    message,
    details,
  };

  // ソケットが接続されているか確認してからエラーを送信
  if (socket.connected) {
    socket.emit('error', errorData);
  }
}
