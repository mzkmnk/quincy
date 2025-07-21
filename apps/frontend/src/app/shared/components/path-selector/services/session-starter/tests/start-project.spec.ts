import type { MessageService } from 'primeng/api';
import type { Router } from '@angular/router';

import { startProject } from '../start-project';
import type { WebSocketService } from '../../../../../../core/services/websocket.service';
import type { AppStore } from '../../../../../../core/store/app.state';

describe('startProject', () => {
  let mockWebSocket: Partial<WebSocketService>;
  let mockAppStore: Partial<AppStore>;
  let mockMessageService: Partial<MessageService>;
  let mockRouter: Partial<Router>;
  let mockStartingSignal: { set: (value: boolean) => void };

  beforeEach(() => {
    mockWebSocket = {
      connect: vi.fn(),
      startProjectSession: vi.fn(),
      setupProjectSessionListeners: vi.fn(),
      setupConversationListeners: vi.fn(),
      on: vi.fn(),
    } as Partial<WebSocketService>;

    mockAppStore = {
      clearCurrentView: vi.fn(),
      setSessionStarting: vi.fn(),
      switchToActiveSession: vi.fn(),
      setSessionError: vi.fn(),
    } as Partial<AppStore>;

    mockMessageService = {
      add: vi.fn(),
    } as Partial<MessageService>;

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    } as Partial<Router>;

    mockStartingSignal = {
      set: vi.fn(),
    };

    // console.logとconsole.errorをモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基本機能', () => {
    it('正常にプロジェクトセッションを開始する', async () => {
      await startProject(
        '/Users/test/project',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(mockStartingSignal.set).toHaveBeenCalledWith(true);
      expect(mockWebSocket.connect).toHaveBeenCalled();
      expect(mockAppStore.clearCurrentView).toHaveBeenCalled();
      expect(mockAppStore.setSessionStarting).toHaveBeenCalledWith(true);
      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith('/Users/test/project', false);
      expect(mockWebSocket.setupProjectSessionListeners).toHaveBeenCalled();
      expect(mockWebSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('パスの前後の空白を削除して処理する', async () => {
      await startProject(
        '  /Users/test/project  ',
        true,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith('/Users/test/project', true);
    });

    it('セッション再開フラグを正しく渡す', async () => {
      await startProject(
        '/test/path',
        true,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith('/test/path', true);
    });
  });

  describe('セッション開始成功時の処理', () => {
    it('セッション開始リスナーが正しく設定される', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(mockWebSocket.setupProjectSessionListeners).toHaveBeenCalledWith(expect.any(Function));
    });

    it('セッション開始成功時にアクティブセッションに切り替わる', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      // setupProjectSessionListenersのコールバックを実行
      const setupCalls = (
        mockWebSocket.setupProjectSessionListeners as unknown as {
          mock: { calls: [(data: { sessionId: string; projectPath: string }) => void][] };
        }
      ).mock.calls;
      const callback = setupCalls[0][0];
      const sessionData = { sessionId: 'test-session', projectPath: '/test/path' };

      callback(sessionData);

      expect(mockAppStore.switchToActiveSession).toHaveBeenCalledWith(sessionData);

      // 新しいフローではsetupConversationListenersが呼ばれる
      expect(mockWebSocket.setupConversationListeners).toHaveBeenCalled();

      // conversation:readyイベントをシミュレート
      const conversationCalls = (
        mockWebSocket.setupConversationListeners as unknown as {
          mock: { calls: [(data: unknown) => void, unknown, unknown, unknown][] };
        }
      ).mock.calls;
      const conversationReadyCallback = conversationCalls[0][0];
      const conversationData = {
        sessionId: 'test-session',
        conversationId: 'test-conversation-123',
        projectPath: '/test/path',
      };

      conversationReadyCallback(conversationData);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat', 'test-conversation-123']);
    });
  });

  describe('エラーハンドリング', () => {
    it('WebSocketエラー時に適切なエラーハンドリングを行う', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      // エラーリスナーのコールバックを実行
      const onCalls = (
        mockWebSocket.on as unknown as {
          mock: { calls: [string, (error: { code: string; message: string }) => void][] };
        }
      ).mock.calls;
      const errorCallback = onCalls.find(call => call[0] === 'error')![1];
      const error = { code: 'GENERIC_ERROR', message: 'Test error' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'セッションの開始中にエラーが発生しました。'
      );
      expect(mockStartingSignal.set).toHaveBeenCalledWith(false);
    });

    it('Q_CLI_NOT_AVAILABLE エラーの場合、適切なメッセージを表示', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      const onCalls = (
        mockWebSocket.on as unknown as {
          mock: { calls: [string, (error: { code: string; message: string }) => void][] };
        }
      ).mock.calls;
      const errorCallback = onCalls.find(call => call[0] === 'error')![1];
      const error = { code: 'Q_CLI_NOT_AVAILABLE', message: 'Q CLI not available' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'Amazon Q CLIが見つかりません。Amazon Q CLIをインストールしてから再度お試しください。'
      );
    });

    it('Q_CLI_NOT_FOUND エラーの場合、適切なメッセージを表示', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      const onCalls = (
        mockWebSocket.on as unknown as {
          mock: { calls: [string, (error: { code: string; message: string }) => void][] };
        }
      ).mock.calls;
      const errorCallback = onCalls.find(call => call[0] === 'error')![1];
      const error = { code: 'Q_CLI_NOT_FOUND', message: 'Q CLI not found' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'Amazon Q CLIが見つかりません。Amazon Q CLIをインストールしてから再度お試しください。'
      );
    });

    it('Q_CLI_PERMISSION_ERROR エラーの場合、適切なメッセージを表示', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      const onCalls = (
        mockWebSocket.on as unknown as {
          mock: { calls: [string, (error: { code: string; message: string }) => void][] };
        }
      ).mock.calls;
      const errorCallback = onCalls.find(call => call[0] === 'error')![1];
      const error = { code: 'Q_CLI_PERMISSION_ERROR', message: 'Q CLI permission error' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'Amazon Q CLIの実行権限がありません。ファイルの権限を確認してください。'
      );
    });

    it('Q_CLI_SPAWN_ERROR エラーの場合、適切なメッセージを表示', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      const onCalls = (
        mockWebSocket.on as unknown as {
          mock: { calls: [string, (error: { code: string; message: string }) => void][] };
        }
      ).mock.calls;
      const errorCallback = onCalls.find(call => call[0] === 'error')![1];
      const error = { code: 'Q_CLI_SPAWN_ERROR', message: 'Q CLI spawn error' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'Amazon Q CLIプロセスの起動に失敗しました。インストールを確認してください。'
      );
    });

    it('例外が発生した場合の処理', async () => {
      (mockWebSocket.connect as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'プロジェクトセッションの開始中にエラーが発生しました。'
      );
      expect(mockMessageService.add).toHaveBeenCalledWith({
        severity: 'error',
        summary: 'エラー',
        detail: 'プロジェクトの開始に失敗しました',
        life: 5000,
      });
      expect(mockStartingSignal.set).toHaveBeenCalledWith(false);
    });
  });

  describe('エッジケース', () => {
    it('空のパスでも処理を継続する', async () => {
      await startProject(
        '',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith('', false);
    });

    it('空白のみのパスは空文字として処理する', async () => {
      await startProject(
        '   ',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith('', false);
    });

    it('特殊文字を含むパスでも正常に処理する', async () => {
      const specialPath = '/path/with spaces & special chars!@#';

      await startProject(
        specialPath,
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith(specialPath, false);
    });
  });

  describe('ログ出力の確認', () => {
    it('セッション開始時にログを出力する', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      expect(console.log).toHaveBeenCalledWith('Starting project session:', '/test/path');
    });

    it('セッション開始成功時にログを出力する', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      const setupCalls = (
        mockWebSocket.setupProjectSessionListeners as unknown as {
          mock: { calls: [(data: { sessionId: string; projectPath: string }) => void][] };
        }
      ).mock.calls;
      const callback = setupCalls[0][0];
      const sessionData = { sessionId: 'test-session', projectPath: '/test/project' };

      callback(sessionData);

      expect(console.log).toHaveBeenCalledWith('Amazon Q session started:', sessionData);
    });

    it('エラー発生時にエラーログを出力する', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket as WebSocketService,
        mockAppStore as AppStore,
        mockMessageService as MessageService,
        mockRouter as Router,
        mockStartingSignal
      );

      const onCalls = (
        mockWebSocket.on as unknown as {
          mock: { calls: [string, (error: { code: string; message: string }) => void][] };
        }
      ).mock.calls;
      const errorCallback = onCalls.find(call => call[0] === 'error')![1];
      const error = { code: 'TEST_ERROR', message: 'Test error message' };

      errorCallback(error);

      expect(console.error).toHaveBeenCalledWith('WebSocket error:', error);
    });
  });
});
