/**
 * WebSocket server integration test
 * Basic test to verify WebSocket server functionality
 */

import { createServer, Server } from 'http';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import type { MessageSendEvent, MessageData } from '@quincy/shared';

import { WebSocketService } from '../services/websocket/index';

describe('WebSocket Server', () => {
  let httpServer: Server;
  let webSocketService: WebSocketService;
  let clientSocket: ClientSocket;
  const port = 3001; // Use different port for testing

  beforeAll(async () => {
    // EventEmitterの最大リスナー数を増加
    process.setMaxListeners(20);

    // Create HTTP server for testing
    httpServer = createServer();
    webSocketService = new WebSocketService(httpServer);

    // Start test server
    await new Promise<void>(resolve => {
      httpServer.listen(port, () => {
        resolve();
      });
    });
  });

  afterAll(async () => {
    // クリーンアップ
    if (clientSocket) {
      clientSocket.close();
    }
    if (httpServer) {
      await new Promise<void>(resolve => {
        httpServer.close(() => {
          // EventEmitterリスナーをリセット
          process.setMaxListeners(10);
          resolve();
        });
      });
    }
  });

  beforeEach(async () => {
    // Create client connection
    clientSocket = Client(`http://localhost:${port}`);
    await new Promise<void>(resolve => {
      clientSocket.on('connect', () => {
        // 少し待ってから接続確認
        setTimeout(resolve, 50);
      });
    });
  });

  afterEach(() => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.close();
    }
  });

  it('should accept client connections', async () => {
    // 接続確認は他のテストで実際に動作していることで証明される
    // connectイベントが発火したことでbeforeEachが完了しているため接続は成功している
    if (clientSocket.connected) {
      expect(clientSocket.connected).toBe(true);
    } else {
      // 接続が完了していない場合は短時間待機
      await new Promise<void>(resolve => {
        setTimeout(() => {
          expect(clientSocket.connected).toBe(true);
          resolve();
        }, 100);
      });
    }
  });

  it('should handle message broadcasting', async () => {
    // Create second client to receive broadcast
    const secondClient = Client(`http://localhost:${port}`);

    const promise = new Promise<void>(resolve => {
      secondClient.on('connect', () => {
        // Listen for broadcast message
        secondClient.on('message:broadcast', (data: MessageData) => {
          expect(data.content).toBe('Hello, world!');
          expect(data.senderId).toBe('test-user');
          expect(data.type).toBe('text');
          secondClient.close();
          resolve();
        });

        // Send message from first client (no authentication needed in development)
        const messageData: MessageSendEvent = {
          content: 'Hello, world!',
          senderId: 'test-user',
          type: 'text',
        };
        clientSocket.emit('message:send', messageData);
      });
    });

    await promise;
  });

  it('should handle room management', async () => {
    const joinPromise = new Promise<void>(resolve => {
      clientSocket.on('room:joined', data => {
        expect(data.roomId).toBe('test-room');
        expect(data.timestamp).toBeDefined();
        resolve();
      });
    });

    // Join a room (no authentication needed in development)
    clientSocket.emit('room:join', { roomId: 'test-room' });
    await joinPromise;

    const leavePromise = new Promise<void>(resolve => {
      clientSocket.on('room:left', data => {
        expect(data.roomId).toBe('test-room');
        expect(data.timestamp).toBeDefined();
        resolve();
      });
    });

    // Leave the room
    clientSocket.emit('room:leave', { roomId: 'test-room' });
    await leavePromise;
  });

  it('should handle ping/pong', async () => {
    const promise = new Promise<void>(resolve => {
      clientSocket.on('pong', () => {
        resolve();
      });
    });

    clientSocket.emit('ping');
    await promise;
  });

  it('should track connected users', () => {
    const connectedUsers = webSocketService.getConnectedUsers();
    expect(Array.isArray(connectedUsers)).toBe(true);

    const userCount = webSocketService.getUserCount();
    expect(typeof userCount).toBe('number');
    expect(userCount).toBeGreaterThanOrEqual(0);
  });
});
