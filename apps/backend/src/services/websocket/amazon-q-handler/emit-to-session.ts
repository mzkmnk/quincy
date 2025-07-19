import type { Server as SocketIOServer } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData
} from '@quincy/shared';

import { sessionToSockets } from './session-socket-map';

export function emitToSession<K extends keyof ServerToClientEvents>(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  sessionId: string,
  event: K,
  data: Parameters<ServerToClientEvents[K]>[0]
): void {
  const socketIds = sessionToSockets.get(sessionId);
  if (socketIds) {
    socketIds.forEach(socketId => {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) {
        (socket as any).emit(event, data);
      }
    });
  }
}