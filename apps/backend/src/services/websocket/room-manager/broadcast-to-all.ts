import type { Server as SocketIOServer } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData
} from '@quincy/shared';

export function broadcastToAll<K extends keyof ServerToClientEvents>(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  event: K,
  data: Parameters<ServerToClientEvents[K]>[0]
): void {
  // Socket.IOのジェネリック型システムの制約のため、型アサーションが必要
  // これはSocket.IOライブラリの制約であり、実行時には安全
  (io as any).emit(event, data);
}