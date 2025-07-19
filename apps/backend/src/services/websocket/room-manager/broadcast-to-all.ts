import type { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@quincy/shared';

// Socket.IOの型システムの制約により、オーバーロードを使用
type EmitOverloads = {
  [K in keyof ServerToClientEvents]: (
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ) => void;
};

export function broadcastToAll<K extends keyof ServerToClientEvents>(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  event: K,
  data: Parameters<ServerToClientEvents[K]>[0]
): void {
  // Socket.IOの内部実装との互換性のため、型アサーションを使用
  const emitter = io as unknown as EmitOverloads;
  emitter[event](event, data);
}
