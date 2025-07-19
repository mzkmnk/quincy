import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  QProjectStartEvent,
  QCommandEvent,
  QSessionStartedEvent,
} from '@quincy/shared';

import type { AmazonQCLIService } from '../../amazon-q-cli';

import { addSocketToSession } from './add-socket-to-session';

export async function handleQProjectStart(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: QProjectStartEvent,
  qCliService: AmazonQCLIService,
  sendErrorCallback: (
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    code: string,
    message: string,
    details?: Record<string, string | number | boolean | null>
  ) => void
): Promise<void> {
  try {
    // Amazon Q CLIの可用性をまずチェック
    const cliCheck = await qCliService.checkCLIAvailability();
    if (!cliCheck.available) {
      sendErrorCallback(
        socket,
        'Q_CLI_NOT_AVAILABLE',
        cliCheck.error ||
          'Amazon Q CLI is not installed or not available in PATH. Please install Amazon Q CLI first.'
      );
      return;
    }

    // Amazon Q CLIを指定されたプロジェクトパスで開始
    const commandData: QCommandEvent = {
      command: 'chat',
      workingDir: data.projectPath,
      resume: data.resume || false,
    };

    const sessionId = await qCliService.startSession(commandData.command, {
      workingDir: commandData.workingDir,
      model: commandData.model,
      resume: commandData.resume,
    });

    // セッションIDとソケットIDを紐付け
    addSocketToSession(sessionId, socket.id);

    // セッション開始の通知
    const sessionStartedEvent: QSessionStartedEvent = {
      sessionId,
      projectPath: data.projectPath,
      model: commandData.model,
    };

    socket.emit('q:session:started', sessionStartedEvent);
    socket.emit('session:created', {
      sessionId,
      projectId: socket.data.sessionId || 'unknown',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // エラーの種類によって適切なエラーコードを設定
    let errorCode = 'Q_PROJECT_START_ERROR';
    let userMessage = `Failed to start Amazon Q CLI session: ${errorMessage}`;

    if (errorMessage.includes('ENOENT')) {
      errorCode = 'Q_CLI_NOT_FOUND';
      userMessage =
        'Amazon Q CLI command not found. Please install Amazon Q CLI and ensure it is available in your system PATH.';
    } else if (errorMessage.includes('EACCES')) {
      errorCode = 'Q_CLI_PERMISSION_ERROR';
      userMessage =
        'Permission denied when trying to execute Amazon Q CLI. Please check file permissions.';
    } else if (errorMessage.includes('spawn')) {
      errorCode = 'Q_CLI_SPAWN_ERROR';
      userMessage =
        'Failed to start Amazon Q CLI process. Please check your installation and try again.';
    }

    sendErrorCallback(socket, errorCode, userMessage, {
      originalError: errorMessage,
      projectPath: data.projectPath,
      cliCommand: 'q',
    });
  }
}
