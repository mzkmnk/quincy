import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  QCommandEvent,
  QSessionStartedEvent,
} from '@quincy/shared';

import type { AmazonQCLIService } from '../../amazon-q-cli';

import { addSocketToSession } from './add-socket-to-session';

export async function handleQCommand(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: QCommandEvent,
  qCliService: AmazonQCLIService,
  sendErrorCallback: (
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    code: string,
    message: string
  ) => void
): Promise<void> {
  try {
    const sessionId = await qCliService.startSession(data.command, {
      workingDir: data.workingDir,
      model: data.model,
      resume: data.resume,
    });

    // セッションIDとソケットIDを紐付け
    addSocketToSession(sessionId, socket.id);

    // セッション作成の通知
    socket.emit('session:created', {
      sessionId,
      projectId: socket.data.sessionId || 'unknown',
    });

    // セッション開始の通知（フロントエンドが待っているイベント）
    const sessionStartedEvent: QSessionStartedEvent = {
      sessionId,
      projectPath: data.workingDir,
      model: data.model,
    };
    socket.emit('q:session:started', sessionStartedEvent);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendErrorCallback(socket, 'Q_COMMAND_ERROR', `Failed to start Amazon Q CLI: ${errorMessage}`);
  }
}
