import { handleErrorResponse } from '../handle-error-response';

describe('handleErrorResponse', () => {
  let mockShouldDisplayError: ReturnType<typeof vi.fn>;
  let mockOnHandleError: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockShouldDisplayError = vi.fn();
    mockOnHandleError = vi.fn();
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('セッションIDが一致し、エラー表示判定がtrueの場合', () => {
    it('エラーハンドラーが呼び出される', () => {
      const data = { sessionId: 'session-123', error: 'Connection failed' };
      const sessionId = 'session-123';
      mockShouldDisplayError.mockReturnValue(true);

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(mockShouldDisplayError).toHaveBeenCalledWith('Connection failed');
      expect(mockOnHandleError).toHaveBeenCalledWith('Connection failed');
    });

    it('コンソールにエラーログが出力される', () => {
      const data = { sessionId: 'session-123', error: 'Test error' };
      const sessionId = 'session-123';
      mockShouldDisplayError.mockReturnValue(true);

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(consoleSpy).toHaveBeenCalledWith('Received Q error for current session:', data);
    });
  });

  describe('セッションIDが一致するが、エラー表示判定がfalseの場合', () => {
    it('エラーハンドラーが呼び出されない', () => {
      const data = { sessionId: 'session-123', error: 'Minor error' };
      const sessionId = 'session-123';
      mockShouldDisplayError.mockReturnValue(false);

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(mockShouldDisplayError).toHaveBeenCalledWith('Minor error');
      expect(mockOnHandleError).not.toHaveBeenCalled();
    });

    it('コンソールにはエラーログが出力される', () => {
      const data = { sessionId: 'session-123', error: 'Minor error' };
      const sessionId = 'session-123';
      mockShouldDisplayError.mockReturnValue(false);

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(consoleSpy).toHaveBeenCalledWith('Received Q error for current session:', data);
    });
  });

  describe('セッションIDが一致しない場合', () => {
    it('何も処理されない', () => {
      const data = { sessionId: 'session-123', error: 'Error message' };
      const sessionId = 'session-456';

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(mockShouldDisplayError).not.toHaveBeenCalled();
      expect(mockOnHandleError).not.toHaveBeenCalled();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('エラーメッセージの種類', () => {
    beforeEach(() => {
      mockShouldDisplayError.mockReturnValue(true);
    });

    it('空のエラーメッセージを処理する', () => {
      const data = { sessionId: 'session-123', error: '' };
      const sessionId = 'session-123';

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(mockOnHandleError).toHaveBeenCalledWith('');
    });

    it('長いエラーメッセージを処理する', () => {
      const longError =
        'This is a very long error message that contains detailed information about what went wrong during the process. '.repeat(
          10
        );
      const data = { sessionId: 'session-123', error: longError };
      const sessionId = 'session-123';

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(mockOnHandleError).toHaveBeenCalledWith(longError);
    });

    it('特殊文字を含むエラーメッセージを処理する', () => {
      const specialError = 'エラー: 接続に失敗しました 🚨 <script>alert("xss")</script>';
      const data = { sessionId: 'session-123', error: specialError };
      const sessionId = 'session-123';

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(mockOnHandleError).toHaveBeenCalledWith(specialError);
    });

    it('JSONフォーマットのエラーメッセージを処理する', () => {
      const jsonError =
        '{"code": 500, "message": "Internal Server Error", "details": "Database connection failed"}';
      const data = { sessionId: 'session-123', error: jsonError };
      const sessionId = 'session-123';

      handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(mockOnHandleError).toHaveBeenCalledWith(jsonError);
    });
  });

  describe('shouldDisplayError関数の動作', () => {
    it('異なるエラーメッセージに対して適切に判定する', () => {
      const sessionId = 'session-123';

      // 表示すべきエラー
      mockShouldDisplayError.mockImplementation(
        (error: string) => error.includes('Connection') || error.includes('Timeout')
      );

      const criticalError = { sessionId, error: 'Connection failed' };
      handleErrorResponse(criticalError, sessionId, mockShouldDisplayError, mockOnHandleError);
      expect(mockOnHandleError).toHaveBeenCalledWith('Connection failed');

      const timeoutError = { sessionId, error: 'Timeout occurred' };
      handleErrorResponse(timeoutError, sessionId, mockShouldDisplayError, mockOnHandleError);
      expect(mockOnHandleError).toHaveBeenCalledWith('Timeout occurred');

      // 表示しないエラー
      const minorError = { sessionId, error: 'Minor warning' };
      handleErrorResponse(minorError, sessionId, mockShouldDisplayError, mockOnHandleError);

      expect(mockOnHandleError).toHaveBeenCalledTimes(2); // Critical and timeout only
    });

    it('shouldDisplayErrorが例外を投げた場合、エラーが伝播される', () => {
      const data = { sessionId: 'session-123', error: 'Test error' };
      const sessionId = 'session-123';
      const error = new Error('shouldDisplayError failed');

      mockShouldDisplayError.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);
      }).toThrow(error);
    });
  });

  describe('onHandleError関数の動作', () => {
    beforeEach(() => {
      mockShouldDisplayError.mockReturnValue(true);
    });

    it('onHandleErrorが例外を投げた場合、エラーが伝播される', () => {
      const data = { sessionId: 'session-123', error: 'Test error' };
      const sessionId = 'session-123';
      const error = new Error('onHandleError failed');

      mockOnHandleError.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);
      }).toThrow(error);
    });

    it('onHandleErrorが非同期処理を行っても関数は同期的に完了する', () => {
      const data = { sessionId: 'session-123', error: 'Test error' };
      const sessionId = 'session-123';

      mockOnHandleError.mockImplementation(() => {
        setTimeout(() => {
          // 非同期処理
        }, 0);
      });

      expect(() => {
        handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);
      }).not.toThrow();

      expect(mockOnHandleError).toHaveBeenCalledWith('Test error');
    });
  });

  describe('複数のエラーの連続処理', () => {
    it('同じセッションの複数エラーを順次処理する', () => {
      const sessionId = 'session-123';
      const errors = ['Connection failed', 'Timeout occurred', 'Authentication error'];

      mockShouldDisplayError.mockReturnValue(true);

      errors.forEach(error => {
        const data = { sessionId, error };
        handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);
      });

      expect(mockOnHandleError).toHaveBeenCalledTimes(3);
      expect(mockOnHandleError).toHaveBeenNthCalledWith(1, 'Connection failed');
      expect(mockOnHandleError).toHaveBeenNthCalledWith(2, 'Timeout occurred');
      expect(mockOnHandleError).toHaveBeenNthCalledWith(3, 'Authentication error');
    });

    it('混在するセッションIDからのエラーを適切にフィルタリングする', () => {
      const currentSessionId = 'current-session';
      const otherSessionId = 'other-session';

      mockShouldDisplayError.mockReturnValue(true);

      const errors = [
        { sessionId: currentSessionId, error: 'Current session error 1' },
        { sessionId: otherSessionId, error: 'Other session error' },
        { sessionId: currentSessionId, error: 'Current session error 2' },
      ];

      errors.forEach(data => {
        handleErrorResponse(data, currentSessionId, mockShouldDisplayError, mockOnHandleError);
      });

      expect(mockOnHandleError).toHaveBeenCalledTimes(2);
      expect(mockOnHandleError).toHaveBeenNthCalledWith(1, 'Current session error 1');
      expect(mockOnHandleError).toHaveBeenNthCalledWith(2, 'Current session error 2');
    });
  });

  describe('パフォーマンス', () => {
    it('大量のエラー処理でも効率的に動作する', () => {
      const sessionId = 'session-123';
      mockShouldDisplayError.mockReturnValue(true);

      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        const data = { sessionId, error: `Error ${i}` };
        handleErrorResponse(data, sessionId, mockShouldDisplayError, mockOnHandleError);
      }

      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms以内
      expect(mockOnHandleError).toHaveBeenCalledTimes(1000);
    });
  });

  describe('戻り値', () => {
    it('関数の戻り値がvoidである', () => {
      const data = { sessionId: 'session-123', error: 'Test error' };
      const sessionId = 'session-123';
      mockShouldDisplayError.mockReturnValue(true);

      const result = handleErrorResponse(
        data,
        sessionId,
        mockShouldDisplayError,
        mockOnHandleError
      );

      expect(result).toBeUndefined();
    });
  });
});
