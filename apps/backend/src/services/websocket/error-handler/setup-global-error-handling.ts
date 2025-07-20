import type { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@quincy/shared';

export function setupGlobalErrorHandling(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): void {
  // Socket.IOのエラー型定義
  interface SocketIOError {
    message?: string;
    type?: string;
    description?: string;
    context?: unknown;
    req?: unknown;
    code?: string | number;
  }

  // グローバルエラーハンドリング
  io.engine.on('connection_error', () => {
    // エラーログ記録など
  });

  // サーバーレベルのエラーハンドリング
  // Socket.IOの型定義に'connect_error'が含まれていないため、型アサーションが必要
  (io as unknown as { on: (event: string, handler: (error: SocketIOError) => void) => void }).on(
    'connect_error',
    () => {
      // エラーログ記録など
    }
  );
}
