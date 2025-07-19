import type { Socket } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  QAbortEvent
} from '@quincy/shared';

import type { AmazonQCLIService } from '../../amazon-q-cli';

export async function handleQAbort(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: QAbortEvent,
  qCliService: AmazonQCLIService,
  sendErrorCallback: (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, code: string, message: string) => void
): Promise<void> {
  try {
    const success = await qCliService.abortSession(data.sessionId, 'user_request');
    
    if (!success) {
      sendErrorCallback(socket, 'Q_ABORT_ERROR', `Session ${data.sessionId} not found or already terminated`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendErrorCallback(socket, 'Q_ABORT_ERROR', `Failed to abort session: ${errorMessage}`);
  }
}