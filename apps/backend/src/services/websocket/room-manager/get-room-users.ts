import type { Server as SocketIOServer } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData
} from '@quincy/shared';

export function getRoomUsers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  roomId: string
): string[] {
  const room = io.sockets.adapter.rooms.get(roomId);
  return room ? Array.from(room) : [];
}