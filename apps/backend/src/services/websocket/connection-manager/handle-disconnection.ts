import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@quincy/shared';

import { generateMessageId } from '../../../utils/id-generator';

import { connectedUsers } from './connection-map';

export function handleDisconnection(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  userRooms: Map<string, Set<string>>,
  cleanupSocketFromSessionsCallback: (socketId: string) => void
): void {
  // Remove from connected users
  connectedUsers.delete(socket.id);

  // Clean up session mapping
  cleanupSocketFromSessionsCallback(socket.id);

  // Clean up room tracking
  if (userRooms.has(socket.id)) {
    const socketUserRooms = userRooms.get(socket.id)!;
    socketUserRooms.forEach(roomId => {
      socket.to(roomId).emit('message:broadcast', {
        id: generateMessageId(),
        content: `User disconnected`,
        senderId: 'system',
        timestamp: Date.now(),
        type: 'system',
      });
    });
    userRooms.delete(socket.id);
  }
}
