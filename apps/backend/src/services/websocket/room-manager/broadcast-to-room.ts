import type { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@quincy/shared';

// BroadcastOperatorのオーバーロード型定義
type BroadcastEmitOverloads = {
  [K in keyof ServerToClientEvents]: (
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ) => void;
};

export function broadcastToRoom<K extends keyof ServerToClientEvents>(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  roomId: string,
  event: K,
  data: Parameters<ServerToClientEvents[K]>[0]
): void {
  // Socket.IOのBroadcastOperatorとの互換性のため、型アサーションを使用
  const broadcaster = io.to(roomId) as unknown as BroadcastEmitOverloads;
  broadcaster[event](event, data);
}
