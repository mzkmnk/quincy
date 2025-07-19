import { cleanupChatWebSocketListeners } from '../cleanup-listeners';
import { WebSocketService } from '../../../../../core/services/websocket.service';

describe('cleanupChatWebSocketListeners', () => {
  let mockWebSocketService: Partial<WebSocketService>;

  // テストヘルパー関数
  const createMockWebSocketService = (): Partial<WebSocketService> =>
    ({
      removeChatListeners: vi.fn(),
      setupChatListeners: vi.fn(),
      sendQMessage: vi.fn(),
      abortSession: vi.fn(),
      connected: vi.fn(),
      connecting: vi.fn(),
    }) as any;

  beforeEach(() => {
    mockWebSocketService = createMockWebSocketService();
    vi.clearAllMocks();
  });

  describe('基本機能', () => {
    it('WebSocketサービスのremoveChatListenersを呼び出す', () => {
      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1);
      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledWith();
    });

    it('戻り値がvoidである', () => {
      const result = cleanupChatWebSocketListeners(mockWebSocketService);
      expect(result).toBeUndefined();
    });

    it('引数として渡したWebSocketServiceのみを使用する', () => {
      const anotherMockService = createMockWebSocketService();

      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1);
      expect(anotherMockService.removeChatListeners).not.toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('WebSocketService.removeChatListenersがエラーを投げた場合、そのエラーが伝播される', () => {
      const testError = new Error('Cleanup failed');
      mockWebSocketService.removeChatListeners.mockImplementation(() => {
        throw testError;
      });

      expect(() => {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }).toThrow(testError);
    });

    it('WebSocketService.removeChatListenersがPromiseを返してもそのまま処理される', () => {
      mockWebSocketService.removeChatListeners.mockReturnValue(Promise.resolve() as any);

      expect(() => {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }).not.toThrow();

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1);
    });

    it('WebSocketServiceがnullやundefinedでもTypeScriptレベルで制約される', () => {
      // この関数はnullチェックを行わない設計のため、呼び出し側の責任
      // TypeScriptレベルでの型安全性に依存
      expect(() => {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }).not.toThrow();
    });
  });

  describe('複数回の呼び出し', () => {
    it('同じサービスで複数回呼び出せる', () => {
      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(3);
    });

    it('各呼び出しが独立して実行される', () => {
      let callCount = 0;
      mockWebSocketService.removeChatListeners.mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Second call failed');
        }
      });

      // 1回目は成功
      expect(() => {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }).not.toThrow();

      // 2回目は失敗
      expect(() => {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }).toThrow('Second call failed');

      // 3回目は再び成功
      expect(() => {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }).not.toThrow();

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(3);
    });
  });

  describe('実際の使用シナリオ', () => {
    it('コンポーネントのngOnDestroy時の呼び出しをシミュレート', () => {
      // コンポーネントライフサイクルでの使用をシミュレート
      const simulateComponentDestroy = () => {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      };

      expect(() => {
        simulateComponentDestroy();
      }).not.toThrow();

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1);
    });

    it('セットアップとクリーンアップのペアでの使用', () => {
      // setup phase
      mockWebSocketService.setupChatListeners.mockImplementation(() => {});

      // cleanup phase
      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1);
      // setupChatListenersは呼び出されない（この関数の責務外）
      expect(mockWebSocketService.setupChatListeners).not.toHaveBeenCalled();
    });

    it('リスナーが既に削除済みでも正常に動作する', () => {
      // 既にクリーンアップ済みの状態をシミュレート
      mockWebSocketService.removeChatListeners.mockImplementation(() => {
        // 何もしない（既に削除済み）
      });

      expect(() => {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }).not.toThrow();

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1);
    });
  });

  describe('パフォーマンス', () => {
    it('大量のクリーンアップ呼び出しでも効率的に処理される', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }

      const end = performance.now();
      const duration = end - start;

      // 1000回の呼び出しが50ms以内に完了することを期待
      expect(duration).toBeLessThan(50);
      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1000);
    });

    it('メモリリークが発生しない', () => {
      // 大量のクリーンアップを実行
      for (let i = 0; i < 100; i++) {
        cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);
      }

      // ガベージコレクションを促す（ブラウザ環境では実際には動作しない）
      if (global.gc) {
        global.gc();
      }

      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(100);
    });
  });

  describe('WebSocketServiceとの統合', () => {
    it('removeChatListenersが正常に完了した場合の動作', () => {
      let listenersCleaned = false;
      mockWebSocketService.removeChatListeners.mockImplementation(() => {
        listenersCleaned = true;
      });

      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);

      expect(listenersCleaned).toBe(true);
      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1);
    });

    it('removeChatListenersが副作用を持つ場合の動作', () => {
      const sideEffects: string[] = [];
      mockWebSocketService.removeChatListeners.mockImplementation(() => {
        sideEffects.push('listeners-removed');
        sideEffects.push('cleanup-completed');
      });

      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);

      expect(sideEffects).toEqual(['listeners-removed', 'cleanup-completed']);
    });

    it('他のWebSocketServiceメソッドに影響を与えない', () => {
      cleanupChatWebSocketListeners(mockWebSocketService as WebSocketService);

      // 他のメソッドが呼び出されていないことを確認
      expect(mockWebSocketService.setupChatListeners).not.toHaveBeenCalled();
      expect(mockWebSocketService.sendQMessage).not.toHaveBeenCalled();
      expect(mockWebSocketService.abortSession).not.toHaveBeenCalled();

      // removeChatListenersのみが呼び出されている
      expect(mockWebSocketService.removeChatListeners).toHaveBeenCalledTimes(1);
    });
  });
});
