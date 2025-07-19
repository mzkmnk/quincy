/**
 * Amazon Q CLI & WebSocket Integration Test
 * Amazon Q CLIサービスとWebSocketサービスの結合テスト
 */

import { createServer, Server } from 'http';
import { EventEmitter } from 'events';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import type { QCommandEvent, QAbortEvent, QMessageEvent, QProjectStartEvent } from '@quincy/shared';

import { AmazonQCLIService } from '../services/amazon-q-cli';
import { WebSocketService } from '../services/websocket';

// 統合テスト用のモック設定
jest.mock('child_process');
jest.mock('fs');
jest.mock('util');
// Amazon Q CLI用のモック設定
interface MockChildProcess extends EventEmitter {
  pid: number;
  stdout: EventEmitter;
  stderr: EventEmitter;
  stdin: {
    write: jest.Mock;
    destroyed: boolean;
  };
  kill: jest.Mock;
  killed: boolean;
}

const mockChildProcess = new EventEmitter() as MockChildProcess;
mockChildProcess.pid = 12345;
mockChildProcess.stdout = new EventEmitter();
mockChildProcess.stderr = new EventEmitter();
mockChildProcess.stdin = {
  write: jest.fn(),
  destroyed: false,
};
mockChildProcess.kill = jest.fn();
mockChildProcess.killed = false;

jest.mock('child_process', () => ({
  spawn: jest.fn(() => {
    setTimeout(() => {
      mockChildProcess.emit('spawn');
    }, 10);
    return mockChildProcess;
  }),
}));

// fs.existsSync のモック
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

// util.promisify のモック
jest.mock('util', () => ({
  promisify: jest.fn(() => jest.fn().mockResolvedValue({ stdout: 'q version 1.0.0', stderr: '' })),
  deprecate: jest.fn((fn, _message) => fn),
}));

// SQLite3のモック
const mockDatabase = {
  all: jest.fn(),
  get: jest.fn(),
  close: jest.fn(),
};

jest.mock(
  'sqlite3',
  () => ({
    Database: jest.fn().mockImplementation(() => mockDatabase),
  }),
  { virtual: true }
);

describe('Amazon Q CLI & WebSocket Integration Test', () => {
  let httpServer: Server;
  let _webSocketService: WebSocketService;
  let amazonQService: AmazonQCLIService;
  let clientSocket: ClientSocket;
  let secondClientSocket: ClientSocket;
  const testPort = 3003;

  beforeAll((done): void => {
    // HTTP serverの作成
    httpServer = createServer();

    // Amazon Q CLI サービスの作成
    amazonQService = new AmazonQCLIService();

    // WebSocket サービスの作成
    _webSocketService = new WebSocketService(httpServer);

    // テストサーバーの起動
    httpServer.listen(testPort, (): void => {
      done();
    });
  });

  afterAll((done): void => {
    httpServer?.close(done);
  });

  beforeEach((done): void => {
    jest.clearAllMocks();

    // モックの基本設定
    mockChildProcess.killed = false;
    mockChildProcess.stdin.destroyed = false;

    // SQLite3モックの設定
    mockDatabase.all.mockResolvedValue([]);
    mockDatabase.get.mockResolvedValue(null);

    // クライアント接続
    clientSocket = Client(`http://localhost:${testPort}`);
    clientSocket.on('connect', done);
  });

  afterEach((): void => {
    clientSocket?.close();
    secondClientSocket?.close();
  });

  describe('Amazon Q CLI実行の結合テスト', () => {
    it('WebSocket経由でAmazon Q CLIコマンドを実行し、結果を受信できること', (done): void => {
      const qCommandEvent: QCommandEvent = {
        command: 'help',
        workingDir: '/Users/test/project',
      };

      // セッション開始の確認
      clientSocket.on('q:session:started', (_data): void => {
        expect(_data.sessionId).toMatch(/^q_session_/);
        expect(_data.success).toBe(true);
      });

      // レスポンスの確認
      clientSocket.on('q:response', (_data): void => {
        expect(_data.data).toBe('Amazon Q CLI Help Content');
        expect(_data.type).toBe('stream');
        expect(_data.sessionId).toMatch(/^q_session_/);
        done();
      });

      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);

      // レスポンスをシミュレート
      setTimeout((): void => {
        mockChildProcess.stdout.emit('data', Buffer.from('Amazon Q CLI Help Content'));
      }, 100);
    });

    it('複数のクライアントが同じセッションの結果を受信できること', (done): void => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat "Hello"',
        workingDir: '/Users/test/project',
      };

      // 2つ目のクライアントを作成
      secondClientSocket = Client(`http://localhost:${testPort}`);

      secondClientSocket.on('connect', (): void => {
        let responseCount = 0;
        const expectedResponse = 'Hello from Amazon Q';

        const handleResponse = (_data: { data: string }): void => {
          expect(_data.data).toBe(expectedResponse);
          responseCount++;
          if (responseCount === 2) {
            done();
          }
        };

        // 両方のクライアントでレスポンスを監視
        clientSocket.on('q:response', handleResponse);
        secondClientSocket.on('q:response', handleResponse);

        // 1つ目のクライアントでQ commandを実行
        clientSocket.emit('q:command', qCommandEvent);

        // レスポンスをシミュレート
        setTimeout((): void => {
          mockChildProcess.stdout.emit('data', Buffer.from(expectedResponse));
        }, 100);
      });
    });

    it('セッション中止がWebSocket経由で適切に処理されること', (done): void => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat "Long running task"',
        workingDir: '/Users/test/project',
      };

      let sessionId: string;

      // セッション開始の確認
      clientSocket.on('q:session:started', (_data): void => {
        sessionId = _data.sessionId;

        // セッション中止の実行
        const abortEvent: QAbortEvent = { sessionId };
        clientSocket.emit('q:abort', abortEvent);
      });

      // セッション中止の確認
      clientSocket.on('q:session:aborted', (_data): void => {
        expect(_data.sessionId).toBe(sessionId);
        expect(_data.success).toBe(true);
        expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
        done();
      });

      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
    });
  });

  describe('メッセージ送信の結合テスト', () => {
    it('WebSocket経由でAmazon Q CLIセッションにメッセージを送信できること', (done): void => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat',
        workingDir: '/Users/test/project',
      };

      let sessionId: string;

      // セッション開始後にメッセージ送信
      clientSocket.on('q:session:started', (_data): void => {
        sessionId = _data.sessionId;

        // メッセージ送信
        const messageEvent: QMessageEvent = {
          sessionId,
          message: 'Hello from WebSocket integration test',
        };

        clientSocket.emit('q:message', messageEvent);
      });

      // メッセージ送信結果の確認
      clientSocket.on('q:message:sent', (_data): void => {
        expect(_data.sessionId).toBe(sessionId);
        expect(_data.success).toBe(true);
        expect(mockChildProcess.stdin.write).toHaveBeenCalledWith(
          'Hello from WebSocket integration test\n'
        );
        done();
      });

      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
    });

    it('無効なセッションIDでのメッセージ送信がエラーとして処理されること', (done): void => {
      const messageEvent: QMessageEvent = {
        sessionId: 'invalid_session_id',
        message: 'This should fail',
      };

      // エラーの確認
      clientSocket.on('q:error', (_data): void => {
        expect(_data.error).toContain('Session not found');
        expect(_data.code).toBe('SESSION_NOT_FOUND');
        done();
      });

      // 無効なセッションにメッセージ送信
      clientSocket.emit('q:message', messageEvent);
    });
  });

  describe('履歴機能の結合テスト', () => {
    it('WebSocket経由でAmazon Q履歴を取得できること', (done): void => {
      const mockHistoryData = [
        { id: 1, conversation_id: 'conv_1', project_path: '/Users/test/project' },
        { id: 2, conversation_id: 'conv_2', project_path: '/Users/test/project' },
      ];

      mockDatabase.all.mockResolvedValue(mockHistoryData);

      // 履歴取得の確認
      clientSocket.on('q:history', (_data): void => {
        expect(Array.isArray(_data.history)).toBe(true);
        expect(_data.history.length).toBe(2);
        expect(_data.projectPath).toBe('/Users/test/project');
        done();
      });

      // 履歴取得の実行
      clientSocket.emit('q:history', {
        projectPath: '/Users/test/project',
      });
    });

    it('履歴詳細がWebSocket経由で適切にフォーマットされて返されること', (done): void => {
      const mockDetailedData = [
        {
          id: 1,
          conversation_id: 'conv_1',
          project_path: '/Users/test/project',
          history_data: JSON.stringify([
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ]),
        },
      ];

      mockDatabase.all.mockResolvedValue(mockDetailedData);

      // 履歴詳細取得の確認
      clientSocket.on('q:history:detailed', (_data): void => {
        expect(_data.conversations).toBeDefined();
        expect(_data.stats).toBeDefined();
        expect(_data.projectPath).toBe('/Users/test/project');
        done();
      });

      // 履歴詳細取得の実行
      clientSocket.emit('q:history:detailed', {
        projectPath: '/Users/test/project',
      });
    });
  });

  describe('プロジェクト管理の結合テスト', () => {
    it('WebSocket経由でプロジェクト一覧を取得できること', (done): void => {
      const mockProjectData = [
        { project_path: '/Users/test/project1' },
        { project_path: '/Users/test/project2' },
      ];

      mockDatabase.all.mockResolvedValue(mockProjectData);

      // プロジェクト一覧取得の確認
      clientSocket.on('q:projects', (_data): void => {
        expect(Array.isArray(_data.projects)).toBe(true);
        expect(_data.projects.length).toBe(2);
        expect(_data.projects[0].project_path).toBe('/Users/test/project1');
        done();
      });

      // プロジェクト一覧取得の実行
      clientSocket.emit('q:projects');
    });

    it('WebSocket経由でプロジェクト開始ができること', (done): void => {
      // プロジェクト開始の確認
      clientSocket.on('q:project:started', (_data): void => {
        expect(_data.success).toBe(true);
        expect(_data.projectPath).toBe('/Users/test/project');
        done();
      });

      // プロジェクト開始の実行
      const projectStartEvent: QProjectStartEvent = {
        projectPath: '/Users/test/project',
      };
      clientSocket.emit('q:project:start', projectStartEvent);
    });
  });

  describe('セッション再開の結合テスト', () => {
    it('WebSocket経由でセッション再開ができること', (done): void => {
      // セッション再開の確認
      clientSocket.on('q:session:resumed', (_data): void => {
        expect(_data.success).toBe(true);
        expect(_data.sessionId).toMatch(/^q_session_/);
        done();
      });

      // セッション再開の実行
      clientSocket.emit('q:resume', {
        projectPath: '/Users/test/project',
      });
    });
  });

  describe('エラーハンドリングの結合テスト', () => {
    it('Amazon Q CLIエラーがWebSocket経由で適切に伝播されること', (done): void => {
      const qCommandEvent: QCommandEvent = {
        command: 'invalid-command',
        workingDir: '/Users/test/project',
      };

      // エラーの確認
      clientSocket.on('q:error', (_data): void => {
        expect(_data.error).toBe('CLI Error: Unknown command');
        expect(_data.code).toBe('STDERR');
        expect(_data.sessionId).toMatch(/^q_session_/);
        done();
      });

      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);

      // エラーをシミュレート
      setTimeout((): void => {
        mockChildProcess.stderr.emit('data', Buffer.from('CLI Error: Unknown command'));
      }, 100);
    });

    it('WebSocket切断時にAmazon Q CLIセッションが適切にクリーンアップされること', (done): void => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat "test"',
        workingDir: '/Users/test/project',
      };

      let sessionId: string;

      // セッション開始の確認
      clientSocket.on('q:session:started', (_data): void => {
        sessionId = _data.sessionId;

        // 接続を切断
        clientSocket.disconnect();

        // 少し待ってセッションの状態を確認
        setTimeout((): void => {
          const session = amazonQService.getSession(sessionId);
          if (session) {
            expect(['aborted', 'completed']).toContain(session.status);
          }
          done();
        }, 200);
      });

      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
    });
  });

  describe('リアルタイム通信の結合テスト', () => {
    it('Amazon Q CLIの出力がリアルタイムで複数クライアントに配信されること', (done): void => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat "Generate a long response"',
        workingDir: '/Users/test/project',
      };

      // 2つ目のクライアントを作成
      secondClientSocket = Client(`http://localhost:${testPort}`);

      secondClientSocket.on('connect', (): void => {
        let responseCount = 0;
        const expectedResponses = ['Response part 1', 'Response part 2', 'Response part 3'];

        const handleResponse = (_data: { data: string }): void => {
          expect(expectedResponses).toContain(_data.data);
          responseCount++;
          if (responseCount === 6) {
            // 2 clients × 3 responses
            done();
          }
        };

        // 両方のクライアントでレスポンスを監視
        clientSocket.on('q:response', handleResponse);
        secondClientSocket.on('q:response', handleResponse);

        // 1つ目のクライアントでQ commandを実行
        clientSocket.emit('q:command', qCommandEvent);

        // 段階的にレスポンスをシミュレート
        setTimeout((): void => {
          mockChildProcess.stdout.emit('data', Buffer.from('Response part 1'));
        }, 100);

        setTimeout((): void => {
          mockChildProcess.stdout.emit('data', Buffer.from('Response part 2'));
        }, 200);

        setTimeout((): void => {
          mockChildProcess.stdout.emit('data', Buffer.from('Response part 3'));
        }, 300);
      });
    });
  });

  describe('パフォーマンス結合テスト', () => {
    it('大量のAmazon Q CLIセッションが効率的に管理されること', (done): void => {
      const sessionCount = 10;
      let completedSessions = 0;

      const handleSessionStart = (_data: { sessionId: string; success: boolean }): void => {
        completedSessions++;
        if (completedSessions === sessionCount) {
          // 全セッションが開始されたことを確認
          const activeSessions = amazonQService.getActiveSessions();
          expect(activeSessions.length).toBe(sessionCount);
          done();
        }
      };

      clientSocket.on('q:session:started', handleSessionStart);

      // 複数のセッションを同時に開始
      for (let i = 0; i < sessionCount; i++) {
        clientSocket.emit('q:command', {
          command: `help-${i}`,
          workingDir: '/Users/test/project',
        });
      }
    });
  });

  describe('状態管理の結合テスト', () => {
    it('WebSocketとAmazon Q CLIの状態が同期されること', (done): void => {
      const qCommandEvent: QCommandEvent = {
        command: 'chat "test"',
        workingDir: '/Users/test/project',
      };

      let sessionId: string;

      // セッション開始の確認
      clientSocket.on('q:session:started', (_data): void => {
        sessionId = _data.sessionId;

        // Amazon Q CLIサービスの状態を確認
        const session = amazonQService.getSession(sessionId);
        expect(session).toBeDefined();
        expect(session?.status).toBe('starting');

        // WebSocketサービスの状態を確認
        const userCount = _webSocketService.getUserCount();
        expect(userCount).toBeGreaterThanOrEqual(1);

        done();
      });

      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
    });
  });
});
