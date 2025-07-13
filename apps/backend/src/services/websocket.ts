import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  AuthenticationData,
  MessageData,
  MessageSendEvent,
  RoomData,
  ConnectionInfo,
  ErrorData,
  RoomJoinedEvent,
  RoomLeftEvent,
  QCommandEvent,
  QAbortEvent,
  QHistoryDataResponse,
  QHistoryListResponse,
  AmazonQConversation,
  ConversationMetadata
} from '@quincy/shared';
import { AmazonQCLIService } from './amazon-q-cli';
import { AmazonQHistoryService } from './amazon-q-history';

export class WebSocketService {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private connectedUsers: Map<string, ConnectionInfo> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();
  private qCliService: AmazonQCLIService;
  private qHistoryService: AmazonQHistoryService;

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
          authenticated: false,
          rooms: [],
          userId: undefined,
          sessionId: undefined
        };
        
        // Log connection attempt
        console.log(`🔌 Connection attempt from: ${socket.handshake.address}`);
        next();
      } catch (error) {
        console.error('🔌 Connection middleware error:', error);
        next(new Error('Connection validation failed'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);
      
      // Auto-authenticate all connections in development mode
      const isDevelopment = process.env.NODE_ENV !== 'production';
      socket.data.authenticated = isDevelopment;
      
      const connectionInfo: ConnectionInfo = {
        socketId: socket.id,
        userId: process.env.LOCAL_USER_ID || 'local-user',
        sessionId: `session_${Date.now()}`,
        connectedAt: Date.now(),
        authenticated: isDevelopment
      };
      
      this.connectedUsers.set(socket.id, connectionInfo);
      console.log(`🔐 Auto-authenticated user: ${socket.id} (mode: ${process.env.NODE_ENV || 'development'})`);

      // Handle message sending
      socket.on('message:send', (data: MessageSendEvent) => {
        if (!socket.data.authenticated && process.env.NODE_ENV === 'production') {
          this.sendError(socket, 'UNAUTHORIZED', 'Authentication required');
          return;
        }
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
        if (!socket.data.authenticated && process.env.NODE_ENV === 'production') {
          this.sendError(socket, 'UNAUTHORIZED', 'Authentication required');
          return;
        }
        this.handleQCommand(socket, data);
      });

      // Handle Amazon Q CLI abort
      socket.on('q:abort', (data: QAbortEvent) => {
        this.handleQAbort(socket, data);
      });

      // Handle Amazon Q history requests
      socket.on('q:history', async (data: { projectPath: string }) => {
        if (!socket.data.authenticated && process.env.NODE_ENV === 'production') {
          this.sendError(socket, 'UNAUTHORIZED', 'Authentication required');
          return;
        }
        await this.handleQHistory(socket, data);
      });

      // Handle Amazon Q projects history list
      socket.on('q:projects', async () => {
        if (!socket.data.authenticated && process.env.NODE_ENV === 'production') {
          this.sendError(socket, 'UNAUTHORIZED', 'Authentication required');
          return;
        }
        await this.handleQProjects(socket);
      });

      // Handle Amazon Q session resume
      socket.on('q:resume', async (data: { projectPath: string; conversationId?: string }) => {
        if (!socket.data.authenticated && process.env.NODE_ENV === 'production') {
          this.sendError(socket, 'UNAUTHORIZED', 'Authentication required');
          return;
        }
        await this.handleQResume(socket, data);
      });

      // Handle ping
      socket.on('ping', () => {
        socket.emit('pong');
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
        this.handleDisconnection(socket);
      });

      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`🔌 Socket error for ${socket.id}:`, error);
        this.sendError(socket, 'SOCKET_ERROR', 'WebSocket connection error');
      });
    });
  }


  private handleMessageSend(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: MessageSendEvent) {
    const messageData: MessageData = {
      id: this.generateMessageId(),
      content: data.content,
      senderId: data.senderId,
      timestamp: Date.now(),
      type: data.type
    };

    // If roomId is specified, broadcast to room
    if (data.roomId) {
      socket.to(data.roomId).emit('message:broadcast', messageData);
      console.log(`📢 Message broadcast to room ${data.roomId}: ${data.content}`);
    } else {
      // Broadcast to all connected clients
      socket.broadcast.emit('message:broadcast', messageData);
      console.log(`📢 Message broadcast to all: ${data.content}`);
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
      userId: socket.data.userId || socket.id,
      timestamp: Date.now()
    };

    // Notify the user
    socket.emit('room:joined', joinEvent);
    
    // Notify other users in the room
    socket.to(roomId).emit('message:broadcast', {
      id: this.generateMessageId(),
      content: `${socket.data.userId || 'Anonymous'} joined the room`,
      senderId: 'system',
      timestamp: Date.now(),
      type: 'system'
    });

    console.log(`🏠 User ${socket.data.userId || socket.id} joined room: ${roomId}`);
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
      userId: socket.data.userId || socket.id,
      timestamp: Date.now()
    };

    // Notify the user
    socket.emit('room:left', leaveEvent);
    
    // Notify other users in the room
    socket.to(roomId).emit('message:broadcast', {
      id: this.generateMessageId(),
      content: `${socket.data.userId || 'Anonymous'} left the room`,
      senderId: 'system',
      timestamp: Date.now(),
      type: 'system'
    });

    console.log(`🏠 User ${socket.data.userId || socket.id} left room: ${roomId}`);
  }

  private handleDisconnection(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    // Remove from connected users
    this.connectedUsers.delete(socket.id);
    
    // Clean up room tracking
    if (this.userRooms.has(socket.id)) {
      const userRooms = this.userRooms.get(socket.id)!;
      userRooms.forEach(roomId => {
        socket.to(roomId).emit('message:broadcast', {
          id: this.generateMessageId(),
          content: `${socket.data.userId || 'Anonymous'} disconnected`,
          senderId: 'system',
          timestamp: Date.now(),
          type: 'system'
        });
      });
      this.userRooms.delete(socket.id);
    }

    console.log(`🔌 Cleaned up connection: ${socket.id}`);
  }

  private sendError(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, code: string, message: string, details?: Record<string, unknown>) {
    const errorData: ErrorData = {
      code,
      message,
      details
    };
    socket.emit('error', errorData);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
    (this.io.to(roomId) as any).emit(event, data);
  }

  public broadcastToAll<K extends keyof ServerToClientEvents>(
    event: K, 
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    (this.io as any).emit(event, data);
  }

  public getSocketIOServer(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    return this.io;
  }

  private setupQCLIEventHandlers(): void {
    // Amazon Q CLIサービスからのイベントをWebSocketクライアントに転送
    this.qCliService.on('q:response', (data) => {
      this.io.emit('q:response', data);
    });

    this.qCliService.on('q:error', (data) => {
      this.io.emit('q:error', data);
    });

    this.qCliService.on('q:complete', (data) => {
      this.io.emit('q:complete', data);
    });

    this.qCliService.on('session:aborted', (data) => {
      this.io.emit('q:complete', {
        sessionId: data.sessionId,
        exitCode: data.exitCode || 0
      });
    });
  }

  private async handleQCommand(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: QCommandEvent): Promise<void> {
    try {
      const sessionId = await this.qCliService.startSession(data.command, {
        workingDir: data.workingDir,
        model: data.model,
        resume: data.resume
      });

      // セッション作成の通知
      socket.emit('session:created', {
        sessionId,
        projectId: socket.data.sessionId || 'unknown'
      });

      console.log(`🤖 Amazon Q CLI session started: ${sessionId} for user ${socket.data.userId}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendError(socket, 'Q_COMMAND_ERROR', `Failed to start Amazon Q CLI: ${errorMessage}`);
    }
  }

  private async handleQAbort(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: QAbortEvent): Promise<void> {
    try {
      const success = await this.qCliService.abortSession(data.sessionId, 'user_request');
      
      if (success) {
        console.log(`🛑 Amazon Q CLI session aborted: ${data.sessionId} by user ${socket.data.userId}`);
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
      console.log(`📚 Request for Q history: ${data.projectPath}`);
      
      if (!this.qHistoryService.isDatabaseAvailable()) {
        console.log('❌ Amazon Q database not available');
        this.sendError(socket, 'Q_HISTORY_UNAVAILABLE', 'Amazon Q database is not available');
        return;
      }

      const conversation = await this.qHistoryService.getProjectHistory(data.projectPath);
      
      if (!conversation) {
        console.log(`⚠️ No conversation found for: ${data.projectPath}`);
        socket.emit('q:history:data', {
          projectPath: data.projectPath,
          conversation: null,
          message: 'No conversation history found for this project'
        });
        return;
      }

      console.log(`✅ Retrieved Q history for project: ${data.projectPath}, messages: ${conversation.transcript?.length || 0}`);
      socket.emit('q:history:data', {
        projectPath: data.projectPath,
        conversation
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Error getting Q history for ${data.projectPath}:`, error);
      this.sendError(socket, 'Q_HISTORY_ERROR', `Failed to get project history: ${errorMessage}`);
    }
  }

  private async handleQProjects(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>): Promise<void> {
    try {
      if (!this.qHistoryService.isDatabaseAvailable()) {
        this.sendError(socket, 'Q_PROJECTS_UNAVAILABLE', 'Amazon Q database is not available');
        return;
      }

      const projects = await this.qHistoryService.getAllProjectsHistory();
      
      socket.emit('q:history:list', {
        projects,
        count: projects.length
      });

      console.log(`📋 Retrieved Q projects list: ${projects.length} projects`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendError(socket, 'Q_PROJECTS_ERROR', `Failed to get projects list: ${errorMessage}`);
    }
  }

  private async handleQResume(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>, data: { projectPath: string; conversationId?: string }): Promise<void> {
    try {
      if (!this.qHistoryService.isDatabaseAvailable()) {
        this.sendError(socket, 'Q_RESUME_UNAVAILABLE', 'Amazon Q database is not available');
        return;
      }

      // Check if conversation exists
      const conversation = await this.qHistoryService.getProjectHistory(data.projectPath);
      if (!conversation) {
        this.sendError(socket, 'Q_RESUME_NO_HISTORY', 'No conversation history found for this project');
        return;
      }

      // Start Amazon Q CLI with resume option
      const commandData: QCommandEvent = {
        command: 'chat',
        workingDir: data.projectPath,
        resume: true
      };

      await this.handleQCommand(socket, commandData);
      
      console.log(`🔄 Amazon Q CLI session resumed for project: ${data.projectPath}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.sendError(socket, 'Q_RESUME_ERROR', `Failed to resume session: ${errorMessage}`);
    }
  }

  // Amazon Q CLIサービスの公開メソッド
  public getQCLIService(): AmazonQCLIService {
    return this.qCliService;
  }

  public async terminateAllQSessions(): Promise<void> {
    await this.qCliService.terminateAllSessions();
  }
}