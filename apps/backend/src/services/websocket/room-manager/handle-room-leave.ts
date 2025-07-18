import type { Socket } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  RoomData,
  RoomLeftEvent
} from '@quincy/shared';
import { userRooms } from './room-map';
import { generateMessageId } from '../../../utils/id-generator';

export function handleRoomLeave(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: RoomData
): void {
  const { roomId } = data;
  
  // Leave the room
  socket.leave(roomId);
  
  // Update socket data
  socket.data.rooms = socket.data.rooms.filter((r: string) => r !== roomId);
  
  // Update user rooms tracking
  if (userRooms.has(socket.id)) {
    userRooms.get(socket.id)!.delete(roomId);
  }

  const leaveEvent: RoomLeftEvent = {
    roomId,
    timestamp: Date.now()
  };

  // Notify the user
  socket.emit('room:left', leaveEvent);
  
  // Notify other users in the room
  socket.to(roomId).emit('message:broadcast', {
    id: generateMessageId(),
    content: `User left the room`,
    senderId: 'system',
    timestamp: Date.now(),
    type: 'system'
  });
}