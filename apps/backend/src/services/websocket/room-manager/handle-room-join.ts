import type { Socket } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  RoomData,
  RoomJoinedEvent
} from '@quincy/shared';

import { generateMessageId } from '../../../utils/id-generator';

import { userRooms } from './room-map';

export function handleRoomJoin(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: RoomData
): void {
  const { roomId } = data;
  
  // Join the room
  socket.join(roomId);
  
  // Update socket data
  socket.data.rooms.push(roomId);
  
  // Update user rooms tracking
  if (!userRooms.has(socket.id)) {
    userRooms.set(socket.id, new Set());
  }
  userRooms.get(socket.id)!.add(roomId);

  const joinEvent: RoomJoinedEvent = {
    roomId,
    timestamp: Date.now()
  };

  // Notify the user
  socket.emit('room:joined', joinEvent);
  
  // Notify other users in the room
  socket.to(roomId).emit('message:broadcast', {
    id: generateMessageId(),
    content: `User joined the room`,
    senderId: 'system',
    timestamp: Date.now(),
    type: 'system'
  });
}