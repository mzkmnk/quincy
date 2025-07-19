import type { Server as SocketIOServer } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  MessageSendEvent,
  RoomData,
  QCommandEvent,
  QMessageEvent,
  QAbortEvent,
  QProjectStartEvent,
} from '@quincy/shared';

import type { AmazonQCLIService } from '../../amazon-q-cli';
import type { AmazonQHistoryService } from '../../amazon-q-history';
// Import handlers
import { handleConnection, handleDisconnection } from '../connection-manager';
import { handleRoomJoin, handleRoomLeave, userRooms } from '../room-manager';
import { handleMessageSend } from '../message-handler';
import { sendError, setupGlobalErrorHandling } from '../error-handler';
import {
  handleQCommand,
  handleQAbort,
  handleQMessage,
  handleQHistory,
  handleQHistoryDetailed,
  handleQProjects,
  handleQResume,
  handleQProjectStart,
  cleanupSocketFromSessions,
} from '../amazon-q-handler';

export function setupEventHandlers(
  io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  qCliService: AmazonQCLIService,
  qHistoryService: AmazonQHistoryService
): void {
  // Middleware for connection validation
  io.use((socket, next) => {
    try {
      // Initialize socket data
      socket.data = {
        rooms: [],
        sessionId: undefined,
      };

      next();
    } catch {
      next(new Error('Connection validation failed'));
    }
  });

  io.on('connection', socket => {
    handleConnection(socket);

    // Handle message sending
    socket.on('message:send', (data: MessageSendEvent) => {
      handleMessageSend(socket, data);
    });

    // Handle room joining
    socket.on('room:join', (data: RoomData) => {
      handleRoomJoin(socket, data);
    });

    // Handle room leaving
    socket.on('room:leave', (data: RoomData) => {
      handleRoomLeave(socket, data);
    });

    // Handle Amazon Q CLI command
    socket.on('q:command', (data: QCommandEvent) => {
      handleQCommand(socket, data, qCliService, sendError);
    });

    // Handle Amazon Q message sending
    socket.on(
      'q:message',
      async (
        data: QMessageEvent,
        ack?: (response: { success: boolean; error?: string }) => void
      ) => {
        await handleQMessage(socket, data, qCliService, sendError, ack);
      }
    );

    // Handle Amazon Q CLI abort
    socket.on('q:abort', (data: QAbortEvent) => {
      handleQAbort(socket, data, qCliService, sendError);
    });

    // Handle Amazon Q history requests
    socket.on('q:history', async (data: { projectPath: string }) => {
      await handleQHistory(socket, data, qHistoryService, sendError);
    });

    // Handle Amazon Q detailed history requests
    socket.on('q:history:detailed', async (data: { projectPath: string }) => {
      await handleQHistoryDetailed(socket, data, qHistoryService, sendError);
    });

    // Handle Amazon Q projects history list
    socket.on('q:projects', async () => {
      await handleQProjects(socket, qHistoryService, sendError);
    });

    // Handle Amazon Q session resume
    socket.on('q:resume', async (data: { projectPath: string; conversationId?: string }) => {
      await handleQResume(socket, data, qCliService, qHistoryService, sendError);
    });

    // Handle Amazon Q project start
    socket.on('q:project:start', async (data: QProjectStartEvent) => {
      await handleQProjectStart(socket, data, qCliService, sendError);
    });

    // Handle ping
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Handle disconnection
    socket.on('disconnect', _reason => {
      handleDisconnection(socket, userRooms, cleanupSocketFromSessions);
    });

    // Handle connection errors
    socket.on('error', _error => {
      sendError(socket, 'SOCKET_ERROR', 'WebSocket connection error');
    });
  });

  // グローバルエラーハンドリングを設定
  setupGlobalErrorHandling(io);
}
