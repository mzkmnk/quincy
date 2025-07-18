import type { Socket } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData
} from '@quincy/shared';
import type { AmazonQHistoryService } from '../../amazon-q-history';

export async function handleQHistoryDetailed(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  data: { projectPath: string },
  qHistoryService: AmazonQHistoryService,
  sendErrorCallback: (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, code: string, message: string) => void
): Promise<void> {
  try {
    if (!qHistoryService.isDatabaseAvailable()) {
      sendErrorCallback(socket, 'Q_HISTORY_UNAVAILABLE', 'Amazon Q database is not available');
      return;
    }

    const displayMessages = await qHistoryService.getProjectHistoryDetailed(data.projectPath);
    const stats = await qHistoryService.getConversationStats(data.projectPath);
    
    if (displayMessages.length === 0) {
      socket.emit('q:history:detailed:data', {
        projectPath: data.projectPath,
        displayMessages: [],
        stats: null,
        message: 'No detailed conversation history found for this project'
      });
      return;
    }

    socket.emit('q:history:detailed:data', {
      projectPath: data.projectPath,
      displayMessages,
      stats
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    sendErrorCallback(socket, 'Q_HISTORY_DETAILED_ERROR', `Failed to get detailed project history: ${errorMessage}`);
  }
}