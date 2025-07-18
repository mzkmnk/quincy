import type { Server as SocketIOServer } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData
} from '@quincy/shared';

export function broadcastToRoom<K extends keyof ServerToClientEvents>(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  roomId: string,
  event: K,
  data: Parameters<ServerToClientEvents[K]>[0]
): void {
  // Socket.IOのBroadcastOperator型とジェネリック型の非互換性のため、型アサーションが必要
  // これはSocket.IOライブラリの制約であり、実行時には安全
  (io.to(roomId) as any).emit(event, data);
}