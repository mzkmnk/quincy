/**
 * WebSocket Service Integration Test
 * 複数のコンポーネントを組み合わせた統合テスト
 */

import { createServer, Server } from 'http';
import { EventEmitter } from 'events';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import type { 
  MessageSendEvent, 
  MessageData,
  RoomData,
  QCommandEvent,
  QAbortEvent,
  QMessageEvent
} from '@quincy/shared';

import { AmazonQCLIService } from '../services/amazon-q-cli';
import { WebSocketService } from '../services/websocket';

// 統合テスト用のモック設定
jest.mock('child_process');
jest.mock('fs');
jest.mock('util');

// Amazon Q CLI用のモック設定
const mockChildProcess = new EventEmitter() as any;
mockChildProcess.pid = 12345;
mockChildProcess.stdout = new EventEmitter();
mockChildProcess.stderr = new EventEmitter();
mockChildProcess.stdin = {
  write: jest.fn(),
  destroyed: false
};
mockChildProcess.kill = jest.fn();
mockChildProcess.killed = false;

jest.mock('child_process', () => ({
  spawn: jest.fn(() => {
    setTimeout(() => {
      mockChildProcess.emit('spawn');
    }, 10);
    return mockChildProcess;
  })
}));

// fs.existsSync のモック
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true)
}));

// util.promisify のモック
jest.mock('util', () => ({
  promisify: jest.fn(() => 
    jest.fn().mockResolvedValue({ stdout: 'q version 1.0.0', stderr: '' })
  ),
  deprecate: jest.fn((fn, message) => fn)
}));

describe('WebSocket Service Integration Test', () => {
  let httpServer: Server;
  let webSocketService: WebSocketService;
  let amazonQService: AmazonQCLIService;
  let clientSocket: ClientSocket;
  let secondClientSocket: ClientSocket;
  const testPort = 3002;

  beforeAll((done) => {
    // HTTP serverの作成
    httpServer = createServer();
    
    // Amazon Q CLI サービスの作成
    amazonQService = new AmazonQCLIService();
    
    // WebSocket サービスの作成
    webSocketService = new WebSocketService(httpServer);
    
    // テストサーバーの起動
    httpServer.listen(testPort, () => {
      done();
    });
  });

  afterAll((done) => {
    httpServer?.close(done);
  });

  beforeEach((done) => {
    jest.clearAllMocks();
    
    // モックの基本設定
    mockChildProcess.killed = false;
    mockChildProcess.stdin.destroyed = false;
    
    // クライアント接続
    clientSocket = Client(`http://localhost:${testPort}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket?.close();
    secondClientSocket?.close();
  });

  describe('基本的なWebSocket機能統合テスト', () => {
    it('接続管理とルーム管理が統合的に動作すること', (done) => {
      const roomId = 'test-integration-room';
      
      // 2つ目のクライアントを作成
      secondClientSocket = Client(`http://localhost:${testPort}`);
      
      secondClientSocket.on('connect', () => {
        // 両方のクライアントを同じルームに参加
        const joinEvent: RoomData = { roomId };
        
        clientSocket.emit('room:join', joinEvent);
        secondClientSocket.emit('room:join', joinEvent);
        
        let joinCount = 0;
        const handleJoin = () => {
          joinCount++;
          if (joinCount === 2) {
            // ルーム参加後にメッセージ送信
            const messageEvent: MessageSendEvent = {
              content: 'Hello from integration test',
              senderId: 'test-user-1',
              type: 'text'
            };
            
            // 2つ目のクライアントでメッセージを受信
            secondClientSocket.on('message:broadcast', (data: MessageData) => {
              expect(data.content).toBe('Hello from integration test');
              expect(data.senderId).toBe('test-user-1');
              done();
            });
            
            // 1つ目のクライアントからメッセージ送信
            clientSocket.emit('message:send', messageEvent);
          }
        };
        
        clientSocket.on('room:joined', handleJoin);
        secondClientSocket.on('room:joined', handleJoin);
      });
    });

    it('接続管理とユーザー追跡が統合的に動作すること', (done) => {
      // 初期状態の確認
      const initialUserCount = webSocketService.getUserCount();
      expect(initialUserCount).toBeGreaterThanOrEqual(1);
      
      // 2つ目のクライアント接続
      secondClientSocket = Client(`http://localhost:${testPort}`);
      
      secondClientSocket.on('connect', () => {
        // 接続後のユーザー数確認
        setTimeout(() => {
          const userCount = webSocketService.getUserCount();
          expect(userCount).toBeGreaterThanOrEqual(2);
          
          const connectedUsers = webSocketService.getConnectedUsers();
          expect(connectedUsers.length).toBeGreaterThanOrEqual(2);
          
          done();
        }, 100);
      });
    });
  });

  describe('Amazon Q統合機能テスト', () => {
    it('Q commandの実行とレスポンス処理が統合的に動作すること', (done) => {
      const qCommandEvent: QCommandEvent = {
        command: 'help',
        workingDir: '/Users/test/project'
      };
      
      // Q responseイベントのリスナー設定
      clientSocket.on('q:response', (data) => {
        expect(data.data).toBeDefined();
        expect(data.sessionId).toMatch(/^q_session_/);
        expect(data.type).toBe('stream');
        done();
      });
      
      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
      
      // レスポンスをシミュレート
      setTimeout(() => {
        mockChildProcess.stdout.emit('data', Buffer.from('Q CLI Help'));
      }, 100);
    });

    it('Q sessionの管理とWebSocketの統合が正常に動作すること', (done) => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat "Hello"',
        workingDir: '/Users/test/project'
      };
      
      let sessionId: string;
      
      // セッション開始の確認
      clientSocket.on('q:session:started', (data) => {
        sessionId = data.sessionId;
        expect(sessionId).toMatch(/^q_session_/);
        
        // セッション中止のテスト
        const abortEvent: QAbortEvent = { sessionId };
        clientSocket.emit('q:abort', abortEvent);
      });
      
      // セッション中止の確認
      clientSocket.on('q:session:aborted', (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.success).toBe(true);
        done();
      });
      
      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
    });

    it('Q messageの送信とセッション管理が統合的に動作すること', (done) => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat',
        workingDir: '/Users/test/project'
      };
      
      let sessionId: string;
      
      // セッション開始後にメッセージ送信
      clientSocket.on('q:session:started', (data) => {
        sessionId = data.sessionId;
        
        // メッセージ送信
        const messageEvent: QMessageEvent = {
          sessionId,
          message: 'Hello from WebSocket integration test'
        };
        
        clientSocket.emit('q:message', messageEvent);
      });
      
      // メッセージ送信結果の確認
      clientSocket.on('q:message:sent', (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.success).toBe(true);
        done();
      });
      
      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
    });
  });

  describe('エラーハンドリング統合テスト', () => {
    it('WebSocketエラーとAmazon Qエラーが統合的に処理されること', (done) => {
      const invalidQCommandEvent: QCommandEvent = {
        command: 'invalid-command',
        workingDir: '/invalid/path'
      };
      
      // エラーイベントのリスナー設定
      clientSocket.on('q:error', (data) => {
        expect(data.error).toBeDefined();
        expect(data.code).toBeDefined();
        done();
      });
      
      // 無効なQ commandの実行
      clientSocket.emit('q:command', invalidQCommandEvent);
    });

    it('接続エラーとセッションクリーンアップが統合的に動作すること', (done) => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat "test"',
        workingDir: '/Users/test/project'
      };
      
      let sessionId: string;
      
      // セッション開始の確認
      clientSocket.on('q:session:started', (data) => {
        sessionId = data.sessionId;
        
        // 接続を切断（セッションクリーンアップのテスト）
        clientSocket.disconnect();
        
        // 少し待ってセッションの状態を確認
        setTimeout(() => {
          // セッションがクリーンアップされているか確認
          const session = amazonQService.getSession(sessionId);
          if (session) {
            expect(session.status).toBe('aborted');
          }
          done();
        }, 200);
      });
      
      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
    });
  });

  describe('履歴機能統合テスト', () => {
    it('Q historyの取得とWebSocketでの配信が統合的に動作すること', (done) => {
      // 履歴取得のリスナー設定
      clientSocket.on('q:history', (data) => {
        expect(Array.isArray(data.history)).toBe(true);
        expect(data.projectPath).toBeDefined();
        done();
      });
      
      // 履歴取得の実行
      clientSocket.emit('q:history', { projectPath: '/Users/test/project' });
    });

    it('Q history詳細の取得とフォーマットが統合的に動作すること', (done) => {
      // 履歴詳細取得のリスナー設定
      clientSocket.on('q:history:detailed', (data) => {
        expect(data.conversations).toBeDefined();
        expect(data.stats).toBeDefined();
        expect(data.projectPath).toBeDefined();
        done();
      });
      
      // 履歴詳細取得の実行
      clientSocket.emit('q:history:detailed', { projectPath: '/Users/test/project' });
    });
  });

  describe('プロジェクト管理統合テスト', () => {
    it('プロジェクト一覧取得とWebSocketでの配信が統合的に動作すること', (done) => {
      // プロジェクト一覧取得のリスナー設定
      clientSocket.on('q:projects', (data) => {
        expect(Array.isArray(data.projects)).toBe(true);
        done();
      });
      
      // プロジェクト一覧取得の実行
      clientSocket.emit('q:projects');
    });

    it('プロジェクト開始とセッション管理が統合的に動作すること', (done) => {
      // プロジェクト開始のリスナー設定
      clientSocket.on('q:project:started', (data) => {
        expect(data.success).toBe(true);
        expect(data.projectPath).toBe('/Users/test/project');
        done();
      });
      
      // プロジェクト開始の実行
      clientSocket.emit('q:project:start', { projectPath: '/Users/test/project' });
    });
  });

  describe('リアルタイム機能統合テスト', () => {
    it('複数クライアント間でのリアルタイム通信が統合的に動作すること', (done) => {
      const roomId = 'real-time-test-room';
      
      // 2つ目のクライアントを作成
      secondClientSocket = Client(`http://localhost:${testPort}`);
      
      secondClientSocket.on('connect', () => {
        // 両方のクライアントを同じルームに参加
        clientSocket.emit('room:join', { roomId });
        secondClientSocket.emit('room:join', { roomId });
        
        let joinCount = 0;
        const handleJoin = () => {
          joinCount++;
          if (joinCount === 2) {
            // Q commandの実行結果を他のクライアントが受信できるかテスト
            secondClientSocket.on('q:response', (data) => {
              expect(data.data).toBe('Real-time test response');
              done();
            });
            
            // 1つ目のクライアントでQ commandを実行
            clientSocket.emit('q:command', {
              command: 'help',
              workingDir: '/Users/test/project'
            });
            
            // レスポンスをシミュレート
            setTimeout(() => {
              mockChildProcess.stdout.emit('data', Buffer.from('Real-time test response'));
            }, 100);
          }
        };
        
        clientSocket.on('room:joined', handleJoin);
        secondClientSocket.on('room:joined', handleJoin);
      });
    });
  });

  describe('パフォーマンス統合テスト', () => {
    it('多数のイベントが効率的に処理されること', (done) => {
      const eventCount = 100;
      let receivedCount = 0;
      
      // メッセージ受信のリスナー設定
      clientSocket.on('message:broadcast', () => {
        receivedCount++;
        if (receivedCount === eventCount) {
          done();
        }
      });
      
      // 多数のメッセージを送信
      for (let i = 0; i < eventCount; i++) {
        clientSocket.emit('message:send', {
          content: `Message ${i}`,
          senderId: 'test-user',
          type: 'text'
        });
      }
    });
  });
});