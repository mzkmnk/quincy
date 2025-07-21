import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@quincy/shared';

import type { AmazonQHistoryService } from '../../amazon-q-history';

export async function handleQHistory(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: { projectPath: string },
  qHistoryService: AmazonQHistoryService,
  sendErrorCallback: (
    socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    code: string,
    message: string
  ) => void
): Promise<void> {
  try {
    if (!qHistoryService.isDatabaseAvailable()) {
      sendErrorCallback(socket, 'Q_HISTORY_UNAVAILABLE', 'Amazon Q database is not available');
      return;
    }

    const conversation = await qHistoryService.getProjectHistory();

    if (!conversation) {
      socket.emit('q:history:data', {
        projectPath: data.projectPath,
        conversation: null,
        message: 'No conversation history found for this project',
      });
      return;
    }

    // Promptエントリ数を正確に計算（実際のユーザーメッセージ数）
    // 新しいサービス構造では、この計算はサービス内で行われるため、
    // ここでは基本的な計算のみ実行
    // messageCountは現在使用されていないため、コメントアウト
    // let messageCount = 0;
    // if (conversation.history) {
    //   messageCount = Array.isArray(conversation.history) ? conversation.history.length : 0;
    // }

    // 常に空のレスポンスを返す
    socket.emit('q:history:data', {
      projectPath: data.projectPath,
      conversation: null,
      message: 'History service disabled - migrated to stdout/stderr monitoring',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendErrorCallback(socket, 'Q_HISTORY_ERROR', `Failed to get project history: ${errorMessage}`);
  }
}
