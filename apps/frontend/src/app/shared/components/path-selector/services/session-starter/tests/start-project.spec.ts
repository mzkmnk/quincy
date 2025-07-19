import { startProject } from '../start-project';

describe('startProject', () => {
  let mockWebSocket: any;
  let mockAppStore: any;
  let mockMessageService: any;
  let mockRouter: any;
  let mockStartingSignal: any;

  beforeEach(() => {
    mockWebSocket = {
      connect: vi.fn(),
      startProjectSession: vi.fn(),
      setupProjectSessionListeners: vi.fn(),
      on: vi.fn(),
    };

    mockAppStore = {
      clearCurrentView: vi.fn(),
      setSessionStarting: vi.fn(),
      switchToActiveSession: vi.fn(),
      setSessionError: vi.fn(),
    };

    mockMessageService = {
      add: vi.fn(),
    };

    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

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
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
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
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith('/Users/test/project', true);
    });

    it('セッション再開フラグを正しく渡す', async () => {
      await startProject(
        '/test/path',
        true,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
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
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      expect(mockWebSocket.setupProjectSessionListeners).toHaveBeenCalledWith(expect.any(Function));
    });

    it('セッション開始成功時にアクティブセッションに切り替わる', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      // setupProjectSessionListenersのコールバックを実行
      const callback = mockWebSocket.setupProjectSessionListeners.mock.calls[0][0];
      const sessionData = { sessionId: 'test-session', projectPath: '/test/path' };

      callback(sessionData);

      expect(mockAppStore.switchToActiveSession).toHaveBeenCalledWith(sessionData);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat']);
    });
  });

  describe('エラーハンドリング', () => {
    it('WebSocketエラー時に適切なエラーハンドリングを行う', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      // エラーリスナーのコールバックを実行
      const errorCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'error')[1];
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
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      const errorCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'error')[1];
      const error = { code: 'Q_CLI_NOT_AVAILABLE' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'Amazon Q CLIが見つかりません。Amazon Q CLIをインストールしてから再度お試しください。'
      );
    });

    it('Q_CLI_NOT_FOUND エラーの場合、適切なメッセージを表示', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      const errorCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'error')[1];
      const error = { code: 'Q_CLI_NOT_FOUND' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'Amazon Q CLIが見つかりません。Amazon Q CLIをインストールしてから再度お試しください。'
      );
    });

    it('Q_CLI_PERMISSION_ERROR エラーの場合、適切なメッセージを表示', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      const errorCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'error')[1];
      const error = { code: 'Q_CLI_PERMISSION_ERROR' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'Amazon Q CLIの実行権限がありません。ファイルの権限を確認してください。'
      );
    });

    it('Q_CLI_SPAWN_ERROR エラーの場合、適切なメッセージを表示', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      const errorCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'error')[1];
      const error = { code: 'Q_CLI_SPAWN_ERROR' };

      errorCallback(error);

      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(
        'Amazon Q CLIプロセスの起動に失敗しました。インストールを確認してください。'
      );
    });

    it('例外が発生した場合の処理', async () => {
      mockWebSocket.connect.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      await startProject(
        '/test/path',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
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
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith('', false);
    });

    it('空白のみのパスは空文字として処理する', async () => {
      await startProject(
        '   ',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      expect(mockWebSocket.startProjectSession).toHaveBeenCalledWith('', false);
    });

    it('特殊文字を含むパスでも正常に処理する', async () => {
      const specialPath = '/path/with spaces & special chars!@#';

      await startProject(
        specialPath,
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
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
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      expect(console.log).toHaveBeenCalledWith('Starting project session:', '/test/path');
    });

    it('セッション開始成功時にログを出力する', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      const callback = mockWebSocket.setupProjectSessionListeners.mock.calls[0][0];
      const sessionData = { sessionId: 'test-session' };

      callback(sessionData);

      expect(console.log).toHaveBeenCalledWith('Amazon Q session started:', sessionData);
    });

    it('エラー発生時にエラーログを出力する', async () => {
      await startProject(
        '/test/path',
        false,
        mockWebSocket,
        mockAppStore,
        mockMessageService,
        mockRouter,
        mockStartingSignal
      );

      const errorCallback = mockWebSocket.on.mock.calls.find(call => call[0] === 'error')[1];
      const error = { code: 'TEST_ERROR' };

      errorCallback(error);

      expect(console.error).toHaveBeenCalledWith('WebSocket error:', error);
    });
  });
});
