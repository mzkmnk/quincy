import { of, Subject } from 'rxjs';
import { resumeSession, SessionStatus } from '../resume-session';
import { WebSocketService } from '../../../../../core/services/websocket.service';
import { AppStore } from '../../../../../core/store/app.state';

describe('resumeSession', () => {
  let mockWebSocketService: Partial<WebSocketService>;
  let mockAppStore: Partial<AppStore>;
  let mockUpdateSessionStatus: ReturnType<typeof vi.fn>;
  let sessionFailedSubject: Subject<{ error: string }>;

  beforeEach(() => {
    sessionFailedSubject = new Subject();
    
    mockWebSocketService = {
      onSessionFailed: vi.fn().mockReturnValue(sessionFailedSubject.asObservable()),
      resumeSession: vi.fn(),
      setupProjectSessionListeners: vi.fn()
    };

    mockAppStore = {
      clearCurrentView: vi.fn(),
      setSessionStarting: vi.fn(),
      setSessionError: vi.fn(),
      switchToActiveSession: vi.fn()
    };

    mockUpdateSessionStatus = vi.fn();

    // タイマーのモック
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('基本機能', () => {
    it('有効なプロジェクトパスでセッション再開を開始する', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: true, connectionEstablished: true, workspaceReady: true };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      expect(mockAppStore.clearCurrentView).toHaveBeenCalledTimes(1);
      expect(mockAppStore.setSessionStarting).toHaveBeenCalledWith(true);
      expect(mockWebSocketService.resumeSession).toHaveBeenCalledWith(projectPath, conversationId);
      expect(mockWebSocketService.setupProjectSessionListeners).toHaveBeenCalledTimes(1);
    });

    it('初期セッションステータスが正しくリセットされる', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: true, connectionEstablished: true, workspaceReady: true };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      expect(mockUpdateSessionStatus).toHaveBeenCalledWith({
        cliLaunched: false,
        connectionEstablished: false,
        workspaceReady: false
      });
    });

    it('空のプロジェクトパスの場合、早期リターンする', () => {
      const projectPath = '';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      expect(mockAppStore.clearCurrentView).not.toHaveBeenCalled();
      expect(mockAppStore.setSessionStarting).not.toHaveBeenCalled();
      expect(mockWebSocketService.resumeSession).not.toHaveBeenCalled();
      expect(mockUpdateSessionStatus).not.toHaveBeenCalled();
    });
  });

  describe('セッションステータスの段階的更新', () => {
    it('1秒後にcliLaunchedがtrueになる', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // 1秒経過をシミュレート
      vi.advanceTimersByTime(1000);

      expect(mockUpdateSessionStatus).toHaveBeenCalledWith({
        cliLaunched: true,
        connectionEstablished: false,
        workspaceReady: false
      });
    });

    it('2秒後にconnectionEstablishedがtrueになる', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // 2秒経過をシミュレート
      vi.advanceTimersByTime(2000);

      expect(mockUpdateSessionStatus).toHaveBeenCalledWith({
        cliLaunched: true,
        connectionEstablished: true,
        workspaceReady: false
      });
    });

    it('3秒後にworkspaceReadyがtrueになる', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // 3秒経過をシミュレート
      vi.advanceTimersByTime(3000);

      expect(mockUpdateSessionStatus).toHaveBeenCalledWith({
        cliLaunched: true,
        connectionEstablished: true,
        workspaceReady: true
      });
    });

    it('段階的に呼び出される回数が正しい', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // 初期リセット（1回目）
      expect(mockUpdateSessionStatus).toHaveBeenCalledTimes(1);

      // 1秒後（2回目）
      vi.advanceTimersByTime(1000);
      expect(mockUpdateSessionStatus).toHaveBeenCalledTimes(2);

      // 2秒後（3回目）
      vi.advanceTimersByTime(1000);
      expect(mockUpdateSessionStatus).toHaveBeenCalledTimes(3);

      // 3秒後（4回目）
      vi.advanceTimersByTime(1000);
      expect(mockUpdateSessionStatus).toHaveBeenCalledTimes(4);
    });
  });

  describe('タイムアウト処理', () => {
    it('30秒後にタイムアウトエラーが発生する', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // 30秒経過をシミュレート
      vi.advanceTimersByTime(30000);

      expect(consoleSpy).toHaveBeenCalledWith('Session resume timeout after 30 seconds');
      expect(mockAppStore.setSessionStarting).toHaveBeenCalledWith(false);
      expect(mockAppStore.setSessionError).toHaveBeenCalledWith('Session resume timed out. Please try again.');

      consoleSpy.mockRestore();
    });

    it('セッション成功時にタイムアウトがクリアされる', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };
      const sessionData = { sessionId: 'session-123', projectPath };

      let sessionSuccessCallback: (data: any) => void = () => {};
      mockWebSocketService.setupProjectSessionListeners = vi.fn().mockImplementation((callback) => {
        sessionSuccessCallback = callback;
      });

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // セッション成功をシミュレート
      sessionSuccessCallback(sessionData);

      // タイムアウト時間を過ぎてもタイムアウト処理が呼ばれない
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.advanceTimersByTime(30000);

      expect(consoleSpy).not.toHaveBeenCalledWith('Session resume timeout after 30 seconds');
      expect(mockAppStore.switchToActiveSession).toHaveBeenCalledWith(sessionData);

      consoleSpy.mockRestore();
    });
  });

  describe('セッション失敗処理', () => {
    it('セッション失敗時に適切なエラー処理が行われる', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };
      const errorMessage = 'Connection failed';

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // セッション失敗をシミュレート
      sessionFailedSubject.next({ error: errorMessage });

      expect(consoleSpy).toHaveBeenCalledWith('Session resume failed:', errorMessage);
      expect(mockAppStore.setSessionStarting).toHaveBeenCalledWith(false);
      expect(mockAppStore.setSessionError).toHaveBeenCalledWith(`Failed to resume session: ${errorMessage}`);

      consoleSpy.mockRestore();
    });

    it('セッション失敗時にタイムアウトがクリアされる', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // セッション失敗をシミュレート
      sessionFailedSubject.next({ error: 'Test error' });

      // タイムアウト時間を過ぎてもタイムアウト処理が呼ばれない
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.advanceTimersByTime(30000);

      expect(consoleSpy).not.toHaveBeenCalledWith('Session resume timeout after 30 seconds');

      consoleSpy.mockRestore();
    });
  });

  describe('セッション成功処理', () => {
    it('セッション成功時に適切な処理が行われる', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };
      const sessionData = { sessionId: 'session-123', projectPath };

      let sessionSuccessCallback: (data: any) => void = () => {};
      mockWebSocketService.setupProjectSessionListeners = vi.fn().mockImplementation((callback) => {
        sessionSuccessCallback = callback;
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // セッション成功をシミュレート
      sessionSuccessCallback(sessionData);

      expect(consoleSpy).toHaveBeenCalledWith('Amazon Q session resumed:', sessionData);
      expect(mockAppStore.switchToActiveSession).toHaveBeenCalledWith(sessionData);

      consoleSpy.mockRestore();
    });
  });

  describe('様々な入力パラメータでの動作', () => {
    it('特殊文字を含むプロジェクトパスでも正常に動作する', () => {
      const projectPath = '/Users/test/project with spaces & special chars!@#';
      const conversationId = 'conv-special-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      expect(mockWebSocketService.resumeSession).toHaveBeenCalledWith(projectPath, conversationId);
    });

    it('Unicode文字を含む会話IDでも正常に動作する', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-日本語-123-🚀';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      expect(mockWebSocketService.resumeSession).toHaveBeenCalledWith(projectPath, conversationId);
    });

    it('非常に長いパスでも正常に動作する', () => {
      const projectPath = '/Users/test/' + 'very-long-directory-name-'.repeat(10) + 'project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      expect(mockWebSocketService.resumeSession).toHaveBeenCalledWith(projectPath, conversationId);
    });

    it('空白のみのプロジェクトパスは空として扱われる', () => {
      const projectPath = '   ';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // 空白のみのパスは有効として扱われる（trimされていない）
      expect(mockWebSocketService.resumeSession).toHaveBeenCalledWith(projectPath, conversationId);
    });
  });

  describe('エラーハンドリングとエッジケース', () => {
    it('WebSocketサービスのメソッドがエラーを投げても処理が継続される', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      mockWebSocketService.resumeSession = vi.fn().mockImplementation(() => {
        throw new Error('WebSocket error');
      });

      expect(() => {
        resumeSession(
          projectPath,
          conversationId,
          mockWebSocketService as WebSocketService,
          mockAppStore as AppStore,
          sessionStatus,
          mockUpdateSessionStatus
        );
      }).toThrow('WebSocket error');
    });

    it('AppStoreのメソッドがエラーを投げても処理が継続される', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      mockAppStore.setSessionStarting = vi.fn().mockImplementation(() => {
        throw new Error('AppStore error');
      });

      expect(() => {
        resumeSession(
          projectPath,
          conversationId,
          mockWebSocketService as WebSocketService,
          mockAppStore as AppStore,
          sessionStatus,
          mockUpdateSessionStatus
        );
      }).toThrow('AppStore error');
    });

    it('updateSessionStatusがエラーを投げても処理が継続される', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      mockUpdateSessionStatus.mockImplementation(() => {
        throw new Error('UpdateSessionStatus error');
      });

      expect(() => {
        resumeSession(
          projectPath,
          conversationId,
          mockWebSocketService as WebSocketService,
          mockAppStore as AppStore,
          sessionStatus,
          mockUpdateSessionStatus
        );
      }).toThrow('UpdateSessionStatus error');
    });
  });

  describe('複数回の呼び出し', () => {
    it('連続して呼び出されても正常に動作する', () => {
      const projectPath = '/Users/test/project';
      const conversationId1 = 'conv-123';
      const conversationId2 = 'conv-456';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      // 1回目の呼び出し
      resumeSession(
        projectPath,
        conversationId1,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // 2回目の呼び出し
      resumeSession(
        projectPath,
        conversationId2,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      expect(mockWebSocketService.resumeSession).toHaveBeenCalledTimes(2);
      expect(mockWebSocketService.resumeSession).toHaveBeenNthCalledWith(1, projectPath, conversationId1);
      expect(mockWebSocketService.resumeSession).toHaveBeenNthCalledWith(2, projectPath, conversationId2);
    });
  });

  describe('メモリリークの防止', () => {
    it('セッション成功時にサブスクリプションが解除される', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };
      const sessionData = { sessionId: 'session-123' };

      const mockUnsubscribe = vi.fn();
      sessionFailedSubject.asObservable = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe })
      });

      let sessionSuccessCallback: (data: any) => void = () => {};
      mockWebSocketService.setupProjectSessionListeners = vi.fn().mockImplementation((callback) => {
        sessionSuccessCallback = callback;
      });

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // セッション成功をシミュレート
      sessionSuccessCallback(sessionData);

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('セッション失敗時にサブスクリプションが解除される', () => {
      const projectPath = '/Users/test/project';
      const conversationId = 'conv-123';
      const sessionStatus: SessionStatus = { cliLaunched: false, connectionEstablished: false, workspaceReady: false };

      const mockUnsubscribe = vi.fn();
      sessionFailedSubject.asObservable = vi.fn().mockReturnValue({
        subscribe: vi.fn().mockReturnValue({ unsubscribe: mockUnsubscribe })
      });

      resumeSession(
        projectPath,
        conversationId,
        mockWebSocketService as WebSocketService,
        mockAppStore as AppStore,
        sessionStatus,
        mockUpdateSessionStatus
      );

      // セッション失敗をシミュレート
      sessionFailedSubject.next({ error: 'Test error' });

      expect(mockUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});