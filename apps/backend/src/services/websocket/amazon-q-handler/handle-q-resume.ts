import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  QCommandEvent,
} from '@quincy/shared';

import type { AmazonQCLIService } from '../../amazon-q-cli';
import type { AmazonQHistoryService } from '../../amazon-q-history';

import { handleQCommand } from './handle-q-command';

export async function handleQResume(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: { projectPath: string; conversationId?: string },
  qCliService: AmazonQCLIService,
  qHistoryService: AmazonQHistoryService,
  sendErrorCallback: (
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    code: string,
    message: string
  ) => void
): Promise<void> {
  try {
    if (!qHistoryService.isDatabaseAvailable()) {
      sendErrorCallback(socket, 'Q_RESUME_UNAVAILABLE', 'Amazon Q database is not available');
      socket.emit('q:session:failed', { error: 'Database not available' });
      return;
    }

    // SQLite3機能は削除されており、履歴チェックはスキップ
    // stdout/stderr監視によるリアルタイム処理に移行

    // Start Amazon Q CLI with resume option
    const commandData: QCommandEvent = {
      command: 'chat',
      workingDir: data.projectPath,
      resume: true,
    };

    await handleQCommand(socket, commandData, qCliService, sendErrorCallback);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendErrorCallback(socket, 'Q_RESUME_ERROR', `Failed to resume session: ${errorMessage}`);
    socket.emit('q:session:failed', { error: errorMessage });
  }
}
