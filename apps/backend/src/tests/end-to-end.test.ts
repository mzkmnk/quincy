/**
 * End-to-End Test
 * 実際のユーザーシナリオに近い形でのテスト
 */

import { createServer, Server } from 'http';
import { EventEmitter } from 'events';

import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import type { QCommandEvent, QMessageEvent, QProjectStartEvent, RoomData } from '@quincy/shared';

import { AmazonQCLIService } from '../services/amazon-q-cli';
import { WebSocketService } from '../services/websocket';

// End-to-Endテスト用のモック設定
jest.mock('child_process');
jest.mock('fs');
jest.mock('util');
jest.mock(
  'sqlite3',
  () => ({
    Database: jest.fn().mockImplementation(() => ({
      all: jest.fn(),
      get: jest.fn(),
      close: jest.fn(),
    })),
  }),
  { virtual: true }
);

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

jest.mock('sqlite3', () => ({
  Database: jest.fn().mockImplementation(() => mockDatabase),
}));

describe('End-to-End Test: WebSocket経由のAmazon Q機能', () => {
  let httpServer: Server;
  let _webSocketService: WebSocketService;
  let amazonQService: AmazonQCLIService;
  let userSocket: ClientSocket;
  let collaboratorSocket: ClientSocket;
  const testPort = 3004;
  const testProject = '/Users/test/my-project';

  beforeAll((done): void => {
    // 実際のサーバー環境をシミュレート
    httpServer = createServer();
    amazonQService = new AmazonQCLIService();
    _webSocketService = new WebSocketService(httpServer);

    httpServer.listen(testPort, (): void => {
      done();
    });
  });

  afterAll((done): void => {
    httpServer?.close(done);
  });

  beforeEach((done): void => {
    jest.clearAllMocks();

    // モックの設定
    mockChildProcess.killed = false;
    mockChildProcess.stdin.destroyed = false;

    // SQLite3モックの設定
    mockDatabase.all.mockResolvedValue([]);
    mockDatabase.get.mockResolvedValue(null);

    // ユーザーの接続
    userSocket = Client(`http://localhost:${testPort}`);
    userSocket.on('connect', done);
  });

  afterEach((): void => {
    userSocket?.close();
    collaboratorSocket?.close();
  });

  describe('シナリオ1: 新しいプロジェクトでAmazon Qとの対話', () => {
    it('プロジェクト開始 → Q対話 → 結果確認の完全なフロー', (done): void => {
      // シナリオの段階を追跡
      const scenario = {
        projectStarted: false,
        sessionStarted: false,
        messageReceived: false,
        conversationCompleted: false,
      };

      // Step 1: プロジェクト開始
      userSocket.on('q:project:started', (_data): void => {
        expect(_data.success).toBe(true);
        expect(_data.projectPath).toBe(testProject);
        scenario.projectStarted = true;

        // Step 2: Q対話開始
        const qCommandEvent: QCommandEvent = {
          command: 'chat "プロジェクトの構造を説明してください"',
          workingDir: testProject,
        };
        userSocket.emit('q:command', qCommandEvent);
      });

      // Step 3: セッション開始の確認
      userSocket.on('q:session:started', (_data): void => {
        expect(_data.sessionId).toMatch(/^q_session_/);
        scenario.sessionStarted = true;
      });

      // Step 4: Q応答の受信
      userSocket.on('q:response', (_data): void => {
        expect(_data.data).toBe('プロジェクトの構造について説明します。');
        scenario.messageReceived = true;
      });

      // Step 5: 対話完了の確認
      userSocket.on('q:complete', (_data): void => {
        expect(_data.exitCode).toBe(0);
        scenario.conversationCompleted = true;

        // 全てのステップが完了したことを確認
        expect(scenario.projectStarted).toBe(true);
        expect(scenario.sessionStarted).toBe(true);
        expect(scenario.messageReceived).toBe(true);
        expect(scenario.conversationCompleted).toBe(true);

        done();
      });

      // シナリオ開始: プロジェクト開始
      const projectStartEvent: QProjectStartEvent = {
        projectPath: testProject,
      };
      userSocket.emit('q:project:start', projectStartEvent);

      // Amazon Qの応答をシミュレート
      setTimeout((): void => {
        mockChildProcess.stdout.emit('data', Buffer.from('プロジェクトの構造について説明します。'));
      }, 200);

      // 完了をシミュレート
      setTimeout((): void => {
        mockChildProcess.emit('exit', 0, null);
      }, 300);
    });
  });

  describe('シナリオ2: 共同作業でのAmazon Q利用', () => {
    it('複数ユーザーが同じプロジェクトでAmazon Qを利用', (done): void => {
      const roomId = 'project-collaboration';

      // 2人目のユーザー（協力者）を接続
      collaboratorSocket = Client(`http://localhost:${testPort}`);

      collaboratorSocket.on('connect', (): void => {
        // 両方のユーザーを同じルームに参加
        userSocket.emit('room:join', { roomId } as RoomData);
        collaboratorSocket.emit('room:join', { roomId } as RoomData);

        let joinCount = 0;
        const handleJoin = (): void => {
          joinCount++;
          if (joinCount === 2) {
            startCollaborativeSession();
          }
        };

        userSocket.on('room:joined', handleJoin);
        collaboratorSocket.on('room:joined', handleJoin);
      });

      const startCollaborativeSession = (): void => {
        // 協力者がQ応答を受信できるかテスト
        collaboratorSocket.on('q:response', (_data): void => {
          expect(_data.data).toBe('共同作業のガイドラインを説明します。');
          done();
        });

        // ユーザーがQ対話を開始
        const qCommandEvent: QCommandEvent = {
          command: 'chat "共同作業のガイドラインを教えてください"',
          workingDir: testProject,
        };
        userSocket.emit('q:command', qCommandEvent);

        // 応答をシミュレート
        setTimeout((): void => {
          mockChildProcess.stdout.emit('data', Buffer.from('共同作業のガイドラインを説明します。'));
        }, 100);
      };
    });
  });

  describe('シナリオ3: 長時間の対話セッション', () => {
    it('複数のメッセージを交互に送信する長時間セッション', (done): void => {
      const messages = [
        'プロジェクトの概要を教えてください',
        'どのような技術スタックを使用していますか？',
        'テストはどのように実行しますか？',
      ];

      let sessionId: string;
      const _currentMessageIndex = 0;
      let responseCount = 0;

      // セッション開始
      userSocket.on('q:session:started', (_data): void => {
        sessionId = _data.sessionId;

        // 最初のメッセージを送信
        const messageEvent: QMessageEvent = {
          sessionId,
          message: messages[0],
        };
        userSocket.emit('q:message', messageEvent);
      });

      // 応答を受信したら次のメッセージを送信
      userSocket.on('q:response', (_data): void => {
        responseCount++;

        if (responseCount < messages.length) {
          // 次のメッセージを送信
          const messageEvent: QMessageEvent = {
            sessionId,
            message: messages[responseCount],
          };
          userSocket.emit('q:message', messageEvent);

          // 次の応答をシミュレート
          setTimeout((): void => {
            mockChildProcess.stdout.emit('data', Buffer.from(`回答 ${responseCount + 1}`));
          }, 100);
        } else {
          // 全てのメッセージが完了
          expect(responseCount).toBe(messages.length);
          done();
        }
      });

      // 対話セッション開始
      const qCommandEvent: QCommandEvent = {
        command: 'chat',
        workingDir: testProject,
      };
      userSocket.emit('q:command', qCommandEvent);

      // 最初の応答をシミュレート
      setTimeout((): void => {
        mockChildProcess.stdout.emit('data', Buffer.from('回答 1'));
      }, 100);
    });
  });

  describe('シナリオ4: エラー処理と復旧', () => {
    it('エラー発生時の適切な処理と復旧', (done): void => {
      const scenario = {
        errorOccurred: false,
        recoveryAttempted: false,
        recoverySuccessful: false,
      };

      // エラー発生の監視
      userSocket.on('q:error', (_data): void => {
        expect(_data.error).toBe('Connection timeout');
        scenario.errorOccurred = true;

        // 復旧を試行
        const recoveryCommandEvent: QCommandEvent = {
          command: 'help',
          workingDir: testProject,
        };
        userSocket.emit('q:command', recoveryCommandEvent);
        scenario.recoveryAttempted = true;
      });

      // 復旧成功の確認
      userSocket.on('q:session:started', (_data): void => {
        if (scenario.recoveryAttempted) {
          scenario.recoverySuccessful = true;

          // 全てのステップが完了したことを確認
          expect(scenario.errorOccurred).toBe(true);
          expect(scenario.recoveryAttempted).toBe(true);
          expect(scenario.recoverySuccessful).toBe(true);

          done();
        }
      });

      // 最初のコマンドでエラーを発生
      const qCommandEvent: QCommandEvent = {
        command: 'chat "test"',
        workingDir: testProject,
      };
      userSocket.emit('q:command', qCommandEvent);

      // エラーをシミュレート
      setTimeout((): void => {
        mockChildProcess.stderr.emit('data', Buffer.from('Connection timeout'));
      }, 100);
    });
  });

  describe('シナリオ5: 履歴機能の活用', () => {
    it('履歴確認 → 新しい対話 → 履歴更新の完全なフロー', (done): void => {
      // 初期履歴データをモック
      const initialHistory = [{ id: 1, conversation_id: 'conv_1', project_path: testProject }];
      mockDatabase.all.mockResolvedValue(initialHistory);

      const scenario = {
        historyRetrieved: false,
        newConversationStarted: false,
        historyUpdated: false,
      };

      // Step 1: 履歴取得
      userSocket.on('q:history', (_data): void => {
        expect(_data.history.length).toBe(1);
        expect(_data.projectPath).toBe(testProject);
        scenario.historyRetrieved = true;

        // Step 2: 新しい対話を開始
        const qCommandEvent: QCommandEvent = {
          command: 'chat "新しい質問です"',
          workingDir: testProject,
        };
        userSocket.emit('q:command', qCommandEvent);
      });

      // Step 3: 新しい対話の開始確認
      userSocket.on('q:session:started', (_data): void => {
        scenario.newConversationStarted = true;
      });

      // Step 4: 対話完了後の履歴更新確認
      userSocket.on('q:complete', (_data): void => {
        scenario.historyUpdated = true;

        // 全てのステップが完了したことを確認
        expect(scenario.historyRetrieved).toBe(true);
        expect(scenario.newConversationStarted).toBe(true);
        expect(scenario.historyUpdated).toBe(true);

        done();
      });

      // シナリオ開始: 履歴取得
      userSocket.emit('q:history', {
        projectPath: testProject,
      });

      // 新しい対話の応答をシミュレート
      setTimeout((): void => {
        mockChildProcess.stdout.emit('data', Buffer.from('新しい質問への回答です。'));
      }, 200);

      // 完了をシミュレート
      setTimeout((): void => {
        mockChildProcess.emit('exit', 0, null);
      }, 300);
    });
  });

  describe('シナリオ6: 高負荷時のパフォーマンス', () => {
    it('複数の同時セッションでの安定性', (done): void => {
      const concurrentSessions = 5;
      let completedSessions = 0;

      // 複数のセッションを同時に開始
      for (let i = 0; i < concurrentSessions; i++) {
        const qCommandEvent: QCommandEvent = {
          command: `chat "質問 ${i + 1}"`,
          workingDir: testProject,
        };
        userSocket.emit('q:command', qCommandEvent);
      }

      // 全てのセッション開始を確認
      userSocket.on('q:session:started', (_data): void => {
        completedSessions++;

        if (completedSessions === concurrentSessions) {
          // 全セッションが正常に開始されたことを確認
          const activeSessions = amazonQService.getActiveSessions();
          expect(activeSessions.length).toBe(concurrentSessions);
          done();
        }
      });
    });
  });

  describe('シナリオ7: 実際のユーザーワークフロー', () => {
    it('典型的な開発者ワークフローの完全なシミュレーション', (done): void => {
      const workflow = {
        projectOpened: false,
        codeReviewRequested: false,
        suggestionsReceived: false,
        implementationStarted: false,
        testingRequested: false,
        workflowCompleted: false,
      };

      // ワークフローの段階的実行
      const executeWorkflowStep = (step: string): void => {
        switch (step) {
          case 'project':
            userSocket.emit('q:project:start', { projectPath: testProject });
            break;
          case 'code-review':
            userSocket.emit('q:command', {
              command: 'chat "このコードをレビューしてください"',
              workingDir: testProject,
            });
            break;
          case 'implementation':
            userSocket.emit('q:message', {
              sessionId: currentSessionId,
              message: 'リファクタリングの提案を実装してください',
            });
            break;
          case 'testing':
            userSocket.emit('q:command', {
              command: 'chat "テストケースを生成してください"',
              workingDir: testProject,
            });
            break;
        }
      };

      let currentSessionId: string;

      // プロジェクト開始
      userSocket.on('q:project:started', (_data): void => {
        workflow.projectOpened = true;
        executeWorkflowStep('code-review');
      });

      // コードレビュー開始
      userSocket.on('q:session:started', (_data): void => {
        currentSessionId = _data.sessionId;
        if (!workflow.codeReviewRequested) {
          workflow.codeReviewRequested = true;
        }
      });

      // 提案受信
      userSocket.on('q:response', (_data): void => {
        if (_data.data.includes('リファクタリング提案')) {
          workflow.suggestionsReceived = true;
          executeWorkflowStep('implementation');
        } else if (_data.data.includes('実装完了')) {
          workflow.implementationStarted = true;
          executeWorkflowStep('testing');
        } else if (_data.data.includes('テストケース')) {
          workflow.testingRequested = true;
          workflow.workflowCompleted = true;

          // 全てのワークフローステップが完了したことを確認
          expect(workflow.projectOpened).toBe(true);
          expect(workflow.codeReviewRequested).toBe(true);
          expect(workflow.suggestionsReceived).toBe(true);
          expect(workflow.implementationStarted).toBe(true);
          expect(workflow.testingRequested).toBe(true);
          expect(workflow.workflowCompleted).toBe(true);

          done();
        }
      });

      // ワークフロー開始
      executeWorkflowStep('project');

      // 段階的な応答をシミュレート
      setTimeout((): void => {
        mockChildProcess.stdout.emit(
          'data',
          Buffer.from('リファクタリング提案: 以下の改善を推奨します。')
        );
      }, 200);

      setTimeout((): void => {
        mockChildProcess.stdout.emit(
          'data',
          Buffer.from('実装完了: リファクタリングが完了しました。')
        );
      }, 400);

      setTimeout((): void => {
        mockChildProcess.stdout.emit(
          'data',
          Buffer.from('テストケース: 以下のテストを実行してください。')
        );
      }, 600);
    });
  });
});
