import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  MessageData,
  MessageSendEvent,
  RoomData,
  ConnectionInfo,
  ErrorData,
  RoomJoinedEvent,
  RoomLeftEvent,
  QCommandEvent,
  QAbortEvent,
  QMessageEvent,
  QInfoEvent,
  QProjectStartEvent,
  QSessionStartedEvent,
  QHistoryDataResponse,
  QHistoryListResponse,
  AmazonQConversation,
  ConversationMetadata
} from '@quincy/shared';
import { AmazonQCLIService } from './amazon-q-cli';
import { AmazonQHistoryService } from './amazon-q-history';
import { generateMessageId } from '../utils/id-generator';

export class WebSocketService {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private connectedUsers: Map<string, ConnectionInfo> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();
  private qCliService: AmazonQCLIService;
  private qHistoryService: AmazonQHistoryService;
  // セッションIDとソケットIDのマッピング
  private sessionToSockets: Map<string, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: ['http://localhost:4200'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000,
      connectTimeout: 45000,
      allowEIO3: true,
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
      maxHttpBufferSize: 1e6,
      allowRequest: (req, fn) => {
        // Basic request validation
        fn(null, true);
      }
    });

    this.qCliService = new AmazonQCLIService();
    this.qHistoryService = new AmazonQHistoryService();
    this.setupQCLIEventHandlers();
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // Middleware for connection validation
    this.io.use((socket, next) => {
      try {
        // Initialize socket data
        socket.data = {
          rooms: [],
          sessionId: undefined
        };
        
        // Log connection attempt
        next();
      } catch (error) {
        next(new Error('Connection validation failed'));
      }
    });

    this.io.on('connection', (socket) => {
      
      const connectionInfo: ConnectionInfo = {
        socketId: socket.id,
        sessionId: `session_${Date.now()}`,
        connectedAt: Date.now()
      };
      
      this.connectedUsers.set(socket.id, connectionInfo);

      // Handle message sending
      socket.on('message:send', (data: MessageSendEvent) => {
        this.handleMessageSend(socket, data);
      });

      // Handle room joining
      socket.on('room:join', (data: RoomData) => {
        this.handleRoomJoin(socket, data);
      });

      // Handle room leaving
      socket.on('room:leave', (data: RoomData) => {
        this.handleRoomLeave(socket, data);
      });


      // Handle Amazon Q CLI command
      socket.on('q:command', (data: QCommandEvent) => {
        this.handleQCommand(socket, data);
      });

      // Handle Amazon Q message sending
      socket.on('q:message', async (data: QMessageEvent, ack?: (response: { success: boolean; error?: string }) => void) => {
        await this.handleQMessage(socket, data, ack);
      });

      // Handle Amazon Q CLI abort
      socket.on('q:abort', (data: QAbortEvent) => {
        this.handleQAbort(socket, data);
      });

      // Handle Amazon Q history requests
      socket.on('q:history', async (data: { projectPath: string }) => {
        await this.handleQHistory(socket, data);
      });

      // Handle Amazon Q detailed history requests
      socket.on('q:history:detailed', async (data: { projectPath: string }) => {
        await this.handleQHistoryDetailed(socket, data);
      });

      // Handle Amazon Q projects history list
      socket.on('q:projects', async () => {
        await this.handleQProjects(socket);
      });

      // Handle Amazon Q session resume
      socket.on('q:resume', async (data: { projectPath: string; conversationId?: string }) => {
        await this.handleQResume(socket, data);
      });

      // Handle Amazon Q project start
      socket.on('q:project:start', async (data: QProjectStartEvent) => {
        await this.handleQProjectStart(socket, data);
      });

      // Handle ping
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        this.sendError(socket, 'SOCKET_ERROR', 'WebSocket connection error');
      });
    });
    
    // グローバルエラーハンドリングを設定
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling(): void {
    // Socket.IOのエラー型定義
    interface SocketIOError {
      message?: string;
      type?: string;
      description?: string;
      context?: unknown;
      req?: unknown;
      code?: string | number;
    }

    // グローバルエラーハンドリング
    this.io.engine.on('connection_error', (error: SocketIOError) => {
    });

    // サーバーレベルのエラーハンドリング
    // Socket.IOの型定義に'connect_error'が含まれていないため、型アサーションが必要
    this.io.on('connect_error' as any, (error: SocketIOError) => {
    });

  }


  private handleMessageSend(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: MessageSendEvent) {
    const messageData: MessageData = {
      id: generateMessageId(),
      content: data.content,
      senderId: data.senderId,
      timestamp: Date.now(),
      type: data.type
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

  private handleRoomJoin(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: RoomData) {
    const { roomId } = data;
    
    // Join the room
    socket.join(roomId);
    
    // Update socket data
    socket.data.rooms.push(roomId);
    
    // Update user rooms tracking
    if (!this.userRooms.has(socket.id)) {
      this.userRooms.set(socket.id, new Set());
    }
    this.userRooms.get(socket.id)!.add(roomId);

    const joinEvent: RoomJoinedEvent = {
      roomId,
      timestamp: Date.now()
    };

    // Notify the user
    socket.emit('room:joined', joinEvent);
    
    // Notify other users in the room
    socket.to(roomId).emit('message:broadcast', {
      id: generateMessageId(),
      content: `User joined the room`,
      senderId: 'system',
      timestamp: Date.now(),
      type: 'system'
    });

  }

  private handleRoomLeave(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: RoomData) {
    const { roomId } = data;
    
    // Leave the room
    socket.leave(roomId);
    
    // Update socket data
    socket.data.rooms = socket.data.rooms.filter((r: string) => r !== roomId);
    
    // Update user rooms tracking
    if (this.userRooms.has(socket.id)) {
      this.userRooms.get(socket.id)!.delete(roomId);
    }

    const leaveEvent: RoomLeftEvent = {
      roomId,
      timestamp: Date.now()
    };

    // Notify the user
    socket.emit('room:left', leaveEvent);
    
    // Notify other users in the room
    socket.to(roomId).emit('message:broadcast', {
      id: generateMessageId(),
      content: `User left the room`,
      senderId: 'system',
      timestamp: Date.now(),
      type: 'system'
    });

  }

  private handleDisconnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    // Remove from connected users
    this.connectedUsers.delete(socket.id);
    
    // Clean up session mapping
    this.cleanupSocketFromSessions(socket.id);
    
    // Clean up room tracking
    if (this.userRooms.has(socket.id)) {
      const userRooms = this.userRooms.get(socket.id)!;
      userRooms.forEach(roomId => {
        socket.to(roomId).emit('message:broadcast', {
          id: generateMessageId(),
          content: `User disconnected`,
          senderId: 'system',
          timestamp: Date.now(),
          type: 'system'
        });
      });
      this.userRooms.delete(socket.id);
    }

  }

  private sendError(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, code: string, message: string, details?: Record<string, string | number | boolean | null>) {
    const errorData: ErrorData = {
      code,
      message,
      details
    };
    
    // ログにエラーを記録
    
    // ソケットが接続されているか確認してからエラーを送信
    if (socket.connected) {
      socket.emit('error', errorData);
    } else {
    }
  }



  // Public methods for external use
  public getConnectedUsers(): ConnectionInfo[] {
    return Array.from(this.connectedUsers.values());
  }

  public getUserCount(): number {
    return this.connectedUsers.size;
  }

  public getRoomUsers(roomId: string): string[] {
    const room = this.io.sockets.adapter.rooms.get(roomId);
    return room ? Array.from(room) : [];
  }

  public broadcastToRoom<K extends keyof ServerToClientEvents>(
    roomId: string, 
    event: K, 
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    // Socket.IOのBroadcastOperator型とジェネリック型の非互換性のため、型アサーションが必要
    // これはSocket.IOライブラリの制約であり、実行時には安全
    (this.io.to(roomId) as any).emit(event, data);
  }

  public broadcastToAll<K extends keyof ServerToClientEvents>(
    event: K, 
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    // Socket.IOのジェネリック型システムの制約のため、型アサーションが必要
    // これはSocket.IOライブラリの制約であり、実行時には安全
    (this.io as any).emit(event, data);
  }

  public getSocketIOServer(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    return this.io;
  }

  private setupQCLIEventHandlers(): void {
    // Amazon Q CLIサービスからのイベントをWebSocketクライアントに転送
    this.qCliService.on('q:response', (data) => {
      // セッションに紐付いたソケットのみに配信
      this.emitToSession(data.sessionId, 'q:response', data);
    });

    this.qCliService.on('q:error', (data) => {
      // セッションに紐付いたソケットのみに配信
      this.emitToSession(data.sessionId, 'q:error', data);
    });

    this.qCliService.on('q:info', (data) => {
      // セッションに紐付いたソケットのみに配信
      this.emitToSession(data.sessionId, 'q:info', data);
    });

    this.qCliService.on('q:complete', (data) => {
      // セッションに紐付いたソケットのみに配信
      this.emitToSession(data.sessionId, 'q:complete', data);
      // セッション終了時にマッピングをクリーンアップ
      this.cleanupSession(data.sessionId);
    });

    this.qCliService.on('session:aborted', (data) => {
      this.emitToSession(data.sessionId, 'q:complete', {
        sessionId: data.sessionId,
        exitCode: data.exitCode || 0
      });
      // セッション終了時にマッピングをクリーンアップ
      this.cleanupSession(data.sessionId);
    });
  }

  private async handleQCommand(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: QCommandEvent): Promise<void> {
    try {
      const sessionId = await this.qCliService.startSession(data.command, {
        workingDir: data.workingDir,
        model: data.model,
        resume: data.resume
      });

      // セッションIDとソケットIDを紐付け
      this.addSocketToSession(sessionId, socket.id);

      // セッション作成の通知
      socket.emit('session:created', {
        sessionId,
        projectId: socket.data.sessionId || 'unknown'
      });

      // セッション開始の通知（フロントエンドが待っているイベント）
      const sessionStartedEvent: QSessionStartedEvent = {
        sessionId,
        projectPath: data.workingDir,
        model: data.model
      };
      socket.emit('q:session:started', sessionStartedEvent);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendError(socket, 'Q_COMMAND_ERROR', `Failed to start Amazon Q CLI: ${errorMessage}`);
    }
  }

  private async handleQAbort(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: QAbortEvent): Promise<void> {
    try {
      const success = await this.qCliService.abortSession(data.sessionId, 'user_request');
      
      if (success) {
      } else {
        this.sendError(socket, 'Q_ABORT_ERROR', `Session ${data.sessionId} not found or already terminated`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendError(socket, 'Q_ABORT_ERROR', `Failed to abort session: ${errorMessage}`);
    }
  }

  // Amazon Q履歴関連のハンドラー
  private async handleQHistory(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: { projectPath: string }): Promise<void> {
    try {
      
      if (!this.qHistoryService.isDatabaseAvailable()) {
        this.sendError(socket, 'Q_HISTORY_UNAVAILABLE', 'Amazon Q database is not available');
        return;
      }

      const conversation = await this.qHistoryService.getProjectHistory(data.projectPath);
      
      if (!conversation) {
        socket.emit('q:history:data', {
          projectPath: data.projectPath,
          conversation: null,
          message: 'No conversation history found for this project'
        });
        return;
      }

      // Promptエントリ数を正確に計算（実際のユーザーメッセージ数）
      let messageCount = 0;
      if (conversation.history) {
        try {
          const normalizedHistory = this.qHistoryService['historyTransformer'].normalizeHistoryData(conversation.history);
          messageCount = this.qHistoryService['historyTransformer'].countPromptEntries(normalizedHistory);
        } catch (error) {
            messageCount = Array.isArray(conversation.history) ? conversation.history.length : 0;
        }
      }
      
      // AmazonQConversation型に合わせて変換（historyフィールドを除外）
      const { history, ...conversationForClient } = conversation;
      socket.emit('q:history:data', {
        projectPath: data.projectPath,
        conversation: conversationForClient as AmazonQConversation
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendError(socket, 'Q_HISTORY_ERROR', `Failed to get project history: ${errorMessage}`);
    }
  }

  private async handleQHistoryDetailed(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: { projectPath: string }): Promise<void> {
    try {
      
      if (!this.qHistoryService.isDatabaseAvailable()) {
        this.sendError(socket, 'Q_HISTORY_UNAVAILABLE', 'Amazon Q database is not available');
        return;
      }

      const displayMessages = await this.qHistoryService.getProjectHistoryDetailed(data.projectPath);
      const stats = await this.qHistoryService.getConversationStats(data.projectPath);
      
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
      this.sendError(socket, 'Q_HISTORY_DETAILED_ERROR', `Failed to get detailed project history: ${errorMessage}`);
    }
  }

  private async handleQProjects(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void> {
    try {
      
      if (!this.qHistoryService.isDatabaseAvailable()) {
        this.sendError(socket, 'Q_PROJECTS_UNAVAILABLE', 'Amazon Q database is not available. Please ensure Amazon Q CLI is installed and has been used at least once.');
        return;
      }

      const projects = await this.qHistoryService.getAllProjectsHistory();
      
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
      
      this.sendError(socket, 'Q_PROJECTS_ERROR', userFriendlyMessage);
    }
  }

  private async handleQResume(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: { projectPath: string; conversationId?: string }): Promise<void> {
    try {
      
      if (!this.qHistoryService.isDatabaseAvailable()) {
        this.sendError(socket, 'Q_RESUME_UNAVAILABLE', 'Amazon Q database is not available');
        socket.emit('q:session:failed', { error: 'Database not available' });
        return;
      }

      // Check if conversation exists
      const conversation = await this.qHistoryService.getProjectHistory(data.projectPath);
      if (!conversation) {
        this.sendError(socket, 'Q_RESUME_NO_HISTORY', 'No conversation history found for this project');
        socket.emit('q:session:failed', { error: 'No conversation history' });
        return;
      }

      // Start Amazon Q CLI with resume option
      const commandData: QCommandEvent = {
        command: 'chat',
        workingDir: data.projectPath,
        resume: true
      };

      await this.handleQCommand(socket, commandData);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendError(socket, 'Q_RESUME_ERROR', `Failed to resume session: ${errorMessage}`);
      socket.emit('q:session:failed', { error: errorMessage });
    }
  }

  // Amazon Q CLIサービスの公開メソッド
  public getQCLIService(): AmazonQCLIService {
    return this.qCliService;
  }

  public async terminateAllQSessions(): Promise<void> {
    await this.qCliService.terminateAllSessions();
  }

  private async handleQProjectStart(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: QProjectStartEvent): Promise<void> {
    try {

      // Amazon Q CLIの可用性をまずチェック
      const cliCheck = await this.qCliService.checkCLIAvailability();
      if (!cliCheck.available) {
        this.sendError(socket, 'Q_CLI_NOT_AVAILABLE', 
          cliCheck.error || 'Amazon Q CLI is not installed or not available in PATH. Please install Amazon Q CLI first.'
        );
        return;
      }


      // Amazon Q CLIを指定されたプロジェクトパスで開始
      const commandData: QCommandEvent = {
        command: 'chat',
        workingDir: data.projectPath,
        resume: data.resume || false
      };

      const sessionId = await this.qCliService.startSession(commandData.command, {
        workingDir: commandData.workingDir,
        model: commandData.model,
        resume: commandData.resume
      });

      // セッションIDとソケットIDを紐付け
      this.addSocketToSession(sessionId, socket.id);

      // セッション開始の通知
      const sessionStartedEvent: QSessionStartedEvent = {
        sessionId,
        projectPath: data.projectPath,
        model: commandData.model
      };

      socket.emit('q:session:started', sessionStartedEvent);
      socket.emit('session:created', {
        sessionId,
        projectId: socket.data.sessionId || 'unknown'
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // エラーの種類によって適切なエラーコードを設定
      let errorCode = 'Q_PROJECT_START_ERROR';
      let userMessage = `Failed to start Amazon Q CLI session: ${errorMessage}`;
      
      if (errorMessage.includes('ENOENT')) {
        errorCode = 'Q_CLI_NOT_FOUND';
        userMessage = 'Amazon Q CLI command not found. Please install Amazon Q CLI and ensure it is available in your system PATH.';
      } else if (errorMessage.includes('EACCES')) {
        errorCode = 'Q_CLI_PERMISSION_ERROR';
        userMessage = 'Permission denied when trying to execute Amazon Q CLI. Please check file permissions.';
      } else if (errorMessage.includes('spawn')) {
        errorCode = 'Q_CLI_SPAWN_ERROR';
        userMessage = 'Failed to start Amazon Q CLI process. Please check your installation and try again.';
      }
      
      this.sendError(socket, errorCode, userMessage, {
        originalError: errorMessage,
        projectPath: data.projectPath,
        cliCommand: 'q'
      });
    }
  }

  private async handleQMessage(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: QMessageEvent, ack?: (response: { success: boolean; error?: string }) => void): Promise<void> {
    try {
      
      // Amazon Q CLIセッションにメッセージを送信
      const success = await this.qCliService.sendInput(data.sessionId, data.message + '\n');
      
      if (!success) {
        const errorMsg = `Session ${data.sessionId} not found or not active`;
        this.sendError(socket, 'Q_MESSAGE_ERROR', errorMsg, {
          sessionId: data.sessionId,
          message: data.message
        });
        if (ack) ack({ success: false, error: errorMsg });
        return;
      }
      
      if (ack) ack({ success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.sendError(socket, 'Q_MESSAGE_ERROR', `Failed to send message: ${errorMessage}`, {
        sessionId: data.sessionId,
        message: data.message,
        originalError: errorMessage
      });
      if (ack) ack({ success: false, error: errorMessage });
    }
  }

  /**
   * セッションIDとソケットIDを紐付け
   */
  private addSocketToSession(sessionId: string, socketId: string): void {
    if (!this.sessionToSockets.has(sessionId)) {
      this.sessionToSockets.set(sessionId, new Set());
    }
    this.sessionToSockets.get(sessionId)!.add(socketId);
  }

  /**
   * セッションに紐付いたソケットにイベントを配信
   */
  private emitToSession<K extends keyof ServerToClientEvents>(
    sessionId: string,
    event: K,
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    const socketIds = this.sessionToSockets.get(sessionId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          (socket as any).emit(event, data);
        }
      });
    } else {
    }
  }

  /**
   * セッション終了時のクリーンアップ
   */
  private cleanupSession(sessionId: string): void {
    this.sessionToSockets.delete(sessionId);
  }

  /**
   * ソケット切断時のクリーンアップ
   */
  private cleanupSocketFromSessions(socketId: string): void {
    this.sessionToSockets.forEach((socketIds, sessionId) => {
      if (socketIds.has(socketId)) {
        socketIds.delete(socketId);
        // セッションにソケットが残っていない場合は削除
        if (socketIds.size === 0) {
          this.sessionToSockets.delete(sessionId);
        }
      }
    });
  }
}