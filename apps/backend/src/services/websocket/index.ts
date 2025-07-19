import { Server as HTTPServer } from 'http';

import { Server as SocketIOServer } from 'socket.io';
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData,
  ConnectionInfo
} from '@quincy/shared';

import { AmazonQCLIService } from '../amazon-q-cli';
import { AmazonQHistoryService } from '../amazon-q-history';

// Import分離した関数
import { getConnectedUsers, getUserCount } from './connection-manager';
import { getRoomUsers, broadcastToRoom, broadcastToAll } from './room-manager';
import { setupEventHandlers } from './event-setup';
import { setupQCLIEventHandlers } from './amazon-q-handler';

export class WebSocketService {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
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
      allowRequest: (req, fn): void => {
        // Basic request validation
        fn(null, true);
      }
    });

    this.qCliService = new AmazonQCLIService();
    this.qHistoryService = new AmazonQHistoryService();
    this.setupQCLIEventHandlers();
    this.setupEventHandlers();
  }

  private setupQCLIEventHandlers(): void {
    setupQCLIEventHandlers(this.io, this.qCliService);
  }

  private setupEventHandlers(): void {
    setupEventHandlers(this.io, this.qCliService, this.qHistoryService);
  }

  // Public methods for external use
  public getConnectedUsers(): ConnectionInfo[] {
    return getConnectedUsers();
  }

  public getUserCount(): number {
    return getUserCount();
  }

  public getRoomUsers(roomId: string): string[] {
    return getRoomUsers(this.io, roomId);
  }

  public broadcastToRoom<K extends keyof ServerToClientEvents>(
    roomId: string, 
    event: K, 
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    broadcastToRoom(this.io, roomId, event, data);
  }

  public broadcastToAll<K extends keyof ServerToClientEvents>(
    event: K, 
    data: Parameters<ServerToClientEvents[K]>[0]
  ): void {
    broadcastToAll(this.io, event, data);
  }

  public getSocketIOServer(): SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
    return this.io;
  }

  // Amazon Q CLIサービスの公開メソッド
  public getQCLIService(): AmazonQCLIService {
    return this.qCliService;
  }

  public async terminateAllQSessions(): Promise<void> {
    await this.qCliService.terminateAllSessions();
  }
}