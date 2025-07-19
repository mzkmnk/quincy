/**
 * Amazon Q CLI & WebSocket Integration Test
 * Amazon Q CLIサービスとWebSocketサービスの結合テスト
 */

import { createServer, Server } from 'http';
import { EventEmitter } from 'events';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import type { QCommandEvent, QAbortEvent, QMessageEvent, QProjectStartEvent } from '@quincy/shared';

import { AmazonQCLIService } from '../services/amazon-q-cli';

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
  deprecate: jest.fn((fn,) => fn),
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
  let amazonQService: AmazonQCLIService;
  let clientSocket: ClientSocket;
  let secondClientSocket: ClientSocket;
  const testPort = 3003;

  beforeAll((done): void => {
    // HTTP serverの作成
    httpServer = createServer();

    // Amazon Q CLI サービスの作成
    amazonQService = new AmazonQCLIService();

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
      clientSocket.on('q:session:started', (data: { sessionId: string; success: boolean }): void => {
        expect(data.sessionId).toMatch(/^q_session_/);
        expect(data.success).toBe(true);
      });

      // レスポンスの確認
      clientSocket.on('q:response', (data: { message: string; type: string; sessionId: string }): void => {
        expect(data.message).toBe('Amazon Q CLI Help Content');
        expect(data.type).toBe('stream');
        expect(data.sessionId).toMatch(/^q_session_/);
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

        const handleResponse = (data: { message: string }): void => {
          expect(data.message).toBe(expectedResponse);
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
      clientSocket.on('q:session:started', (data: { sessionId: string }): void => {
        sessionId = data.sessionId;

        // セッション中止の実行
        const abortEvent: QAbortEvent = { sessionId };
        clientSocket.emit('q:abort', abortEvent);
      });

      // セッション中止の確認
      clientSocket.on('q:session:aborted', (data: { sessionId: string; success: boolean }): void => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.success).toBe(true);
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
      clientSocket.on('q:session:started', (data: { sessionId: string }): void => {
        sessionId = data.sessionId;

        // メッセージ送信
        const messageEvent: QMessageEvent = {
          sessionId,
          message: 'Hello from WebSocket integration test',
        };

        clientSocket.emit('q:message', messageEvent);
      });

      // メッセージ送信結果の確認
      clientSocket.on('q:message:sent', (data: { sessionId: string; success: boolean }): void => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.success).toBe(true);
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
      clientSocket.on('q:error', (data: { error: string; code: string }): void => {
        expect(data.error).toContain('Session not found');
        expect(data.code).toBe('SESSION_NOT_FOUND');
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
      clientSocket.on('q:history', (data: { history: { id: number; conversation_id: string; project_path: string }[] }): void => {
        expect(Array.isArray(data.history)).toBe(true);
        expect(data.history.length).toBe(2);
        expect(data.history[0].project_path).toBe('/Users/test/project');
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
          history: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi there!' },
          ],
        },
      ];

      mockDatabase.all.mockResolvedValue(mockDetailedData);

      // 履歴詳細取得の確認
      clientSocket.on('q:history:detailed', (data: { id: number; conversation_id: string; project_path: string; history: { role: string; content: string }[] }): void => {
        expect(data.id).toBeDefined();
        expect(data.conversation_id).toBeDefined();
        expect(data.project_path).toBe('/Users/test/project');
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
      clientSocket.on('q:projects', (data: { projects: { project_path: string }[] }): void => {
        expect(Array.isArray(data.projects)).toBe(true);
        expect(data.projects.length).toBe(2);
        expect(data.projects[0].project_path).toBe('/Users/test/project1');
        done();
      });

      // プロジェクト一覧取得の実行
      clientSocket.emit('q:projects');
    });

    it('WebSocket経由でプロジェクト開始ができること', (done): void => {
      // プロジェクト開始の確認
      clientSocket.on('q:project:started', (data: { success: boolean; projectPath: string }): void => {
        expect(data.success).toBe(true);
        expect(data.projectPath).toBe('/Users/test/project');
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
      clientSocket.on('q:session:resumed', (data: { success: boolean; sessionId: string }): void => {
        expect(data.success).toBe(true);
        expect(data.sessionId).toMatch(/^q_session_/);
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
      clientSocket.on('q:error', (data: { error: string; type: string; sessionId: string }): void => {
        expect(data.error).toBe('CLI Error: Unknown command');
        expect(data.type).toBe('STDERR');
        expect(data.sessionId).toMatch(/^q_session_/);
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
      clientSocket.on('q:session:started', (data: { sessionId: string }): void => {
        sessionId = data.sessionId;

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

        const handleResponse = (data: { message: string }): void => {
          expect(expectedResponses).toContain(data.message);
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

      const handleSessionStart = (): void => {
        completedSessions++;
        if (completedSessions === sessionCount) {
          // 全セッションが開始されたことを確認
          expect(completedSessions).toBe(sessionCount);
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
      clientSocket.on('q:session:started', (data: { sessionId: string }): void => {
        sessionId = data.sessionId;

        // Amazon Q CLIサービスの状態を確認
        const session = amazonQService.getSession(sessionId);
        expect(session).toBeDefined();
        expect(session?.status).toBe('starting');

        // WebSocketサービスの状態を確認
        expect(sessionId).toBeDefined();

        done();
      });

      // Q commandの実行
      clientSocket.emit('q:command', qCommandEvent);
    });
  });
});
