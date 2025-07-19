import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  QMessageEvent,
} from '@quincy/shared';

import type { AmazonQCLIService } from '../../amazon-q-cli';

export async function handleQMessage(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: QMessageEvent,
  qCliService: AmazonQCLIService,
  sendErrorCallback: (
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    code: string,
    message: string,
    details?: Record<string, string | number | boolean | null>
  ) => void,
  ack?: (response: { success: boolean; error?: string }) => void
): Promise<void> {
  try {
    // Amazon Q CLIセッションにメッセージを送信
    const success = await qCliService.sendInput(data.sessionId, data.message + '\n');

    if (!success) {
      const errorMsg = `Session ${data.sessionId} not found or not active`;
      sendErrorCallback(socket, 'Q_MESSAGE_ERROR', errorMsg, {
        sessionId: data.sessionId,
        message: data.message,
      });
      if (ack) ack({ success: false, error: errorMsg });
      return;
    }

    if (ack) ack({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    sendErrorCallback(socket, 'Q_MESSAGE_ERROR', `Failed to send message: ${errorMessage}`, {
      sessionId: data.sessionId,
      message: data.message,
      originalError: errorMessage,
    });
    if (ack) ack({ success: false, error: errorMessage });
  }
}
