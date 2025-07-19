import { handleStreamingResponse } from '../handle-streaming-response';

describe('handleStreamingResponse', () => {
  let mockOnHandleStreaming: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockOnHandleStreaming = vi.fn();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('セッションIDが一致する場合', () => {
    it('ストリーミングコールバックが呼び出される', () => {
      const data = { sessionId: 'session-123', data: 'streaming content' };
      const sessionId = 'session-123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledTimes(1);
      expect(mockOnHandleStreaming).toHaveBeenCalledWith('streaming content');
    });

    it('コンソールにログが出力される', () => {
      const data = { sessionId: 'session-123', data: 'test data' };
      const sessionId = 'session-123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(consoleSpy).toHaveBeenCalledWith('Received Q response for current session:', data);
    });

    it('空のデータでもコールバックが呼び出される', () => {
      const data = { sessionId: 'session-123', data: '' };
      const sessionId = 'session-123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledWith('');
    });

    it('長いデータでも正常に処理される', () => {
      const longData = 'a'.repeat(10000);
      const data = { sessionId: 'session-123', data: longData };
      const sessionId = 'session-123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledWith(longData);
    });

    it('特殊文字を含むデータを正常に処理する', () => {
      const specialData = '日本語 🚀 <script>alert("test")</script> \n\t\r';
      const data = { sessionId: 'session-123', data: specialData };
      const sessionId = 'session-123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledWith(specialData);
    });
  });

  describe('セッションIDが一致しない場合', () => {
    it('ストリーミングコールバックが呼び出されない', () => {
      const data = { sessionId: 'session-123', data: 'streaming content' };
      const sessionId = 'session-456';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).not.toHaveBeenCalled();
    });

    it('コンソールにログが出力されない', () => {
      const data = { sessionId: 'session-123', data: 'test data' };
      const sessionId = 'session-456';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('空のセッションIDでも正しく判定される', () => {
      const data = { sessionId: '', data: 'test data' };
      const sessionId = 'session-123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).not.toHaveBeenCalled();
    });

    it('nullやundefinedのセッションIDを適切に処理する', () => {
      const data = { sessionId: null as unknown as string, data: 'test data' };
      const sessionId = 'session-123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).not.toHaveBeenCalled();
    });
  });

  describe('エッジケース', () => {
    it('セッションIDが数値の場合でも文字列として比較される', () => {
      const data = { sessionId: '123', data: 'test data' };
      const sessionId = '123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledWith('test data');
    });

    it('セッションIDに特殊文字が含まれていても正常に動作する', () => {
      const specialSessionId = 'session-123-$%^&*()_+-=[]{}|;:,.<>?';
      const data = { sessionId: specialSessionId, data: 'test data' };

      handleStreamingResponse(data, specialSessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledWith('test data');
    });

    it('セッションIDが非常に長い場合でも正常に動作する', () => {
      const longSessionId = 'session-' + 'a'.repeat(1000);
      const data = { sessionId: longSessionId, data: 'test data' };

      handleStreamingResponse(data, longSessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledWith('test data');
    });

    it('dataプロパティにオブジェクトが含まれている場合でも文字列として扱われる', () => {
      const objectData = JSON.stringify({ message: 'test', count: 5 });
      const data = { sessionId: 'session-123', data: objectData };
      const sessionId = 'session-123';

      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledWith(objectData);
    });
  });

  describe('コールバック関数のエラーハンドリング', () => {
    it('コールバック関数がエラーを投げた場合、そのエラーが伝播される', () => {
      const data = { sessionId: 'session-123', data: 'test data' };
      const sessionId = 'session-123';
      const error = new Error('Callback error');

      mockOnHandleStreaming.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        handleStreamingResponse(data, sessionId, mockOnHandleStreaming);
      }).toThrow(error);
    });

    it('コールバック関数が非同期エラーを投げた場合でも関数自体は同期的に完了する', () => {
      const data = { sessionId: 'session-123', data: 'test data' };
      const sessionId = 'session-123';

      mockOnHandleStreaming.mockImplementation(() => {
        setTimeout(() => {
          throw new Error('Async error');
        }, 0);
      });

      expect(() => {
        handleStreamingResponse(data, sessionId, mockOnHandleStreaming);
      }).not.toThrow();

      expect(mockOnHandleStreaming).toHaveBeenCalledWith('test data');
    });
  });

  describe('パフォーマンス', () => {
    it('大量のデータでも効率的に処理される', () => {
      const largeData = 'x'.repeat(100000);
      const data = { sessionId: 'session-123', data: largeData };
      const sessionId = 'session-123';

      const start = performance.now();
      handleStreamingResponse(data, sessionId, mockOnHandleStreaming);
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // 10ms以内
      expect(mockOnHandleStreaming).toHaveBeenCalledWith(largeData);
    });

    it('複数回の呼び出しでも一定のパフォーマンスを維持する', () => {
      const data = { sessionId: 'session-123', data: 'test data' };
      const sessionId = 'session-123';

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        handleStreamingResponse(data, sessionId, mockOnHandleStreaming);
      }

      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms以内
      expect(mockOnHandleStreaming).toHaveBeenCalledTimes(1000);
    });
  });

  describe('戻り値', () => {
    it('関数の戻り値がvoidである', () => {
      const data = { sessionId: 'session-123', data: 'test data' };
      const sessionId = 'session-123';

      const result = handleStreamingResponse(data, sessionId, mockOnHandleStreaming);

      expect(result).toBeUndefined();
    });
  });

  describe('実際の使用シナリオ', () => {
    it('リアルタイムチャットでのストリーミングメッセージ処理をシミュレート', () => {
      const messages = ['Hello', ' world', '!', ' How', ' are', ' you', ' today?'];
      let accumulatedMessage = '';

      const streamingHandler = (content: string) => {
        accumulatedMessage += content;
      };

      const sessionId = 'chat-session-1';

      messages.forEach(message => {
        const data = { sessionId, data: message };
        handleStreamingResponse(data, sessionId, streamingHandler);
      });

      expect(accumulatedMessage).toBe('Hello world! How are you today?');
    });

    it('異なるセッションからのメッセージがフィルタリングされることを確認', () => {
      const currentSessionId = 'current-session';
      const otherSessionId = 'other-session';

      const currentSessionData = { sessionId: currentSessionId, data: 'current message' };
      const otherSessionData = { sessionId: otherSessionId, data: 'other message' };

      handleStreamingResponse(currentSessionData, currentSessionId, mockOnHandleStreaming);
      handleStreamingResponse(otherSessionData, currentSessionId, mockOnHandleStreaming);

      expect(mockOnHandleStreaming).toHaveBeenCalledTimes(1);
      expect(mockOnHandleStreaming).toHaveBeenCalledWith('current message');
    });
  });
});
