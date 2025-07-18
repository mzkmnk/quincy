import type { Socket } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  ConnectionInfo
} from '@quincy/shared';
import { connectedUsers } from './connection-map';

export function handleConnection(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
): ConnectionInfo {
  const connectionInfo: ConnectionInfo = {
    socketId: socket.id,
    sessionId: `session_${Date.now()}`,
    connectedAt: Date.now()
  };
  
  connectedUsers.set(socket.id, connectionInfo);
  return connectionInfo;
}