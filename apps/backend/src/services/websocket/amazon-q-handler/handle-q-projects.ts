import type { Socket } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData
} from '@quincy/shared';

import type { AmazonQHistoryService } from '../../amazon-q-history';

export async function handleQProjects(
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  qHistoryService: AmazonQHistoryService,
  sendErrorCallback: (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, code: string, message: string) => void
): Promise<void> {
  try {
    if (!qHistoryService.isDatabaseAvailable()) {
      sendErrorCallback(socket, 'Q_PROJECTS_UNAVAILABLE', 'Amazon Q database is not available. Please ensure Amazon Q CLI is installed and has been used at least once.');
      return;
    }

    const projects = await qHistoryService.getAllProjectsHistory();
    
    socket.emit('q:history:list', {
      projects,
      count: projects.length
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // より具体的なエラーメッセージを提供
    let userFriendlyMessage = 'Failed to get projects list';
    if (errorMessage.includes('データベースにアクセスできません')) {
      userFriendlyMessage = errorMessage;
    } else if (errorMessage.includes('ENOENT')) {
      userFriendlyMessage = 'Amazon Q database file not found. Please use Amazon Q CLI at least once to create the database.';
    } else if (errorMessage.includes('SQLITE_BUSY')) {
      userFriendlyMessage = 'Amazon Q database is currently busy. Please try again in a moment.';
    } else if (errorMessage.includes('permission')) {
      userFriendlyMessage = 'Permission denied accessing Amazon Q database. Please check file permissions.';
    }
    
    sendErrorCallback(socket, 'Q_PROJECTS_ERROR', userFriendlyMessage);
  }
}