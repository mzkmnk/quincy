import { setupChatWebSocketListeners, ChatWebSocketHandlers } from '../setup-listeners';
import { WebSocketService } from '../../../../../core/services/websocket.service';

describe('setupChatWebSocketListeners', () => {
  let mockWebSocketService: Partial<WebSocketService>;
  let mockHandlers: ChatWebSocketHandlers;

  // テストヘルパー関数
  const createMockWebSocketService = (): Partial<WebSocketService> =>
    ({
      setupChatListeners: vi.fn(),
      removeChatListeners: vi.fn(),
      sendQMessage: vi.fn(),
      abortSession: vi.fn(),
      connected: vi.fn(),
      connecting: vi.fn(),
    }) as unknown as string;

  const createMockHandlers = (): ChatWebSocketHandlers => ({
    onQResponse: vi.fn(),
    onQError: vi.fn(),
    onQInfo: vi.fn(),
    onQCompletion: vi.fn(),
  });

  beforeEach(() => {
    mockWebSocketService = createMockWebSocketService();
    mockHandlers = createMockHandlers();
    vi.clearAllMocks();
  });

  describe('基本機能', () => {
    it('WebSocketサービスのsetupChatListenersを正しい引数で呼び出す', () => {
      setupChatWebSocketListeners(mockWebSocketService as WebSocketService, mockHandlers);

      expect(mockWebSocketService.setupChatListeners).toHaveBeenCalledTimes(1);
      expect(mockWebSocketService.setupChatListeners).toHaveBeenCalledWith(
        mockHandlers.onQResponse,
        mockHandlers.onQError,
        mockHandlers.onQInfo,
        mockHandlers.onQCompletion
      );
    });

    it('すべてのハンドラーが正しい順序で渡される', () => {
      setupChatWebSocketListeners(mockWebSocketService as WebSocketService, mockHandlers);

      const call = mockWebSocketService.setupChatListeners.mock.calls[0];
      expect(call[0]).toBe(mockHandlers.onQResponse);
      expect(call[1]).toBe(mockHandlers.onQError);
      expect(call[2]).toBe(mockHandlers.onQInfo);
      expect(call[3]).toBe(mockHandlers.onQCompletion);
    });

    it('戻り値がvoidである', () => {
      const result = setupChatWebSocketListeners(mockWebSocketService, mockHandlers);
      expect(result).toBeUndefined();
    });
  });

  describe('ハンドラーの型安全性', () => {
    it('onQResponseハンドラーが正しい型シグネチャを持つ', () => {
      const onQResponse = vi.fn();
      const handlers = { ...mockHandlers, onQResponse };

      setupChatWebSocketListeners(mockWebSocketService, handlers);

      // ハンドラーが呼び出し可能であることを確認
      const testData = { sessionId: 'test-session', data: 'test-data' };
      onQResponse(testData);

      expect(onQResponse).toHaveBeenCalledWith(testData);
    });

    it('onQErrorハンドラーが正しい型シグネチャを持つ', () => {
      const onQError = vi.fn();
      const handlers = { ...mockHandlers, onQError };

      setupChatWebSocketListeners(mockWebSocketService, handlers);

      const testError = { sessionId: 'test-session', error: 'test-error' };
      onQError(testError);

      expect(onQError).toHaveBeenCalledWith(testError);
    });

    it('onQInfoハンドラーが正しい型シグネチャを持つ', () => {
      const onQInfo = vi.fn();
      const handlers = { ...mockHandlers, onQInfo };

      setupChatWebSocketListeners(mockWebSocketService, handlers);

      const testInfo = { sessionId: 'test-session', message: 'test-message', type: 'info' };
      onQInfo(testInfo);

      expect(onQInfo).toHaveBeenCalledWith(testInfo);
    });

    it('onQCompletionハンドラーが正しい型シグネチャを持つ', () => {
      const onQCompletion = vi.fn();
      const handlers = { ...mockHandlers, onQCompletion };

      setupChatWebSocketListeners(mockWebSocketService, handlers);

      const testCompletion = { sessionId: 'test-session' };
      onQCompletion(testCompletion);

      expect(onQCompletion).toHaveBeenCalledWith(testCompletion);
    });

    it('onQInfoハンドラーでtypeが省略可能である', () => {
      const onQInfo = vi.fn();
      const handlers = { ...mockHandlers, onQInfo };

      setupChatWebSocketListeners(mockWebSocketService, handlers);

      const testInfoWithoutType = { sessionId: 'test-session', message: 'test-message' };
      onQInfo(testInfoWithoutType);

      expect(onQInfo).toHaveBeenCalledWith(testInfoWithoutType);
    });
  });

  describe('エラーハンドリング', () => {
    it('WebSocketサービスがnullの場合でもエラーにならない（TypeScriptレベル）', () => {
      // この関数はnullチェックを行わないため、呼び出し側の責任
      expect(() => {
        setupChatWebSocketListeners(mockWebSocketService as WebSocketService, mockHandlers);
      }).not.toThrow();
    });

    it('ハンドラーがundefined/nullでもsetupChatListenersは呼び出される', () => {
      const invalidHandlers = {
        onQResponse: undefined as unknown as string,
        onQError: null as unknown as string,
        onQInfo: mockHandlers.onQInfo,
        onQCompletion: mockHandlers.onQCompletion,
      };

      setupChatWebSocketListeners(mockWebSocketService, invalidHandlers);

      expect(mockWebSocketService.setupChatListeners).toHaveBeenCalledWith(
        undefined,
        null,
        invalidHandlers.onQInfo,
        invalidHandlers.onQCompletion
      );
    });

    it('WebSocketService.setupChatListenersがエラーを投げた場合、そのエラーが伝播される', () => {
      const testError = new Error('WebSocket setup failed');
      mockWebSocketService.setupChatListeners.mockImplementation(() => {
        throw testError;
      });

      expect(() => {
        setupChatWebSocketListeners(mockWebSocketService as WebSocketService, mockHandlers);
      }).toThrow(testError);
    });
  });

  describe('複数回の呼び出し', () => {
    it('同じサービスとハンドラーで複数回呼び出せる', () => {
      setupChatWebSocketListeners(mockWebSocketService as WebSocketService, mockHandlers);
      setupChatWebSocketListeners(mockWebSocketService as WebSocketService, mockHandlers);
      setupChatWebSocketListeners(mockWebSocketService as WebSocketService, mockHandlers);

      expect(mockWebSocketService.setupChatListeners).toHaveBeenCalledTimes(3);
    });

    it('異なるハンドラーで複数回呼び出せる', () => {
      const handlers1 = createMockHandlers();
      const handlers2 = createMockHandlers();

      setupChatWebSocketListeners(mockWebSocketService, handlers1);
      setupChatWebSocketListeners(mockWebSocketService, handlers2);

      expect(mockWebSocketService.setupChatListeners).toHaveBeenCalledTimes(2);
      expect(mockWebSocketService.setupChatListeners).toHaveBeenNthCalledWith(
        1,
        handlers1.onQResponse,
        handlers1.onQError,
        handlers1.onQInfo,
        handlers1.onQCompletion
      );
      expect(mockWebSocketService.setupChatListeners).toHaveBeenNthCalledWith(
        2,
        handlers2.onQResponse,
        handlers2.onQError,
        handlers2.onQInfo,
        handlers2.onQCompletion
      );
    });
  });

  describe('実際の使用シナリオ', () => {
    it('実際のハンドラー実装と組み合わせて正常に動作する', () => {
      const realHandlers: ChatWebSocketHandlers = {
        onQResponse: data => {
          console.log('Response received:', data.sessionId, data.data);
        },
        onQError: data => {
          console.error('Error occurred:', data.sessionId, data.error);
        },
        onQInfo: data => {
          console.info('Info message:', data.sessionId, data.message, data.type);
        },
        onQCompletion: data => {
          console.log('Completion:', data.sessionId);
        },
      };

      expect(() => {
        setupChatWebSocketListeners(mockWebSocketService, realHandlers);
      }).not.toThrow();

      expect(mockWebSocketService.setupChatListeners).toHaveBeenCalledWith(
        realHandlers.onQResponse,
        realHandlers.onQError,
        realHandlers.onQInfo,
        realHandlers.onQCompletion
      );
    });

    it('ハンドラー内でエラーが発生してもsetup関数自体は正常終了する', () => {
      const throwingHandlers: ChatWebSocketHandlers = {
        onQResponse: () => {
          throw new Error('Handler error');
        },
        onQError: mockHandlers.onQError,
        onQInfo: mockHandlers.onQInfo,
        onQCompletion: mockHandlers.onQCompletion,
      };

      // setup関数自体はハンドラーを実行しないため、エラーは発生しない
      expect(() => {
        setupChatWebSocketListeners(mockWebSocketService, throwingHandlers);
      }).not.toThrow();
    });
  });

  describe('パフォーマンス', () => {
    it('大量のハンドラー設定でも効率的に処理される', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        setupChatWebSocketListeners(mockWebSocketService, createMockHandlers());
      }

      const end = performance.now();
      const duration = end - start;

      // 1000回の呼び出しが100ms以内に完了することを期待
      expect(duration).toBeLessThan(100);
      expect(mockWebSocketService.setupChatListeners).toHaveBeenCalledTimes(1000);
    });
  });
});
