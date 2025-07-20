import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  MessageSendEvent,
  MessageData,
} from '@quincy/shared';

import { generateMessageId } from '../../../utils/id-generator';

export function handleMessageSend(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: MessageSendEvent
): void {
  const messageData: MessageData = {
    id: generateMessageId(),
    content: data.content,
    senderId: data.senderId,
    timestamp: Date.now(),
    type: data.type,
  };

  // If roomId is specified, broadcast to room
  if (data.roomId) {
    socket.to(data.roomId).emit('message:broadcast', messageData);
  } else {
    // Broadcast to all connected clients
    socket.broadcast.emit('message:broadcast', messageData);
  }

  // Send confirmation to sender
  socket.emit('message:received', messageData);
}
