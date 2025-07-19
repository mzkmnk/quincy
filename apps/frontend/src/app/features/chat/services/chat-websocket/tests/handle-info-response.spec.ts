import { handleInfoResponse } from '../handle-info-response';

describe('handleInfoResponse', () => {
  let mockOnHandleInfo: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockOnHandleInfo = vi.fn();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('セッションIDが一致する場合', () => {
    it('情報ハンドラーが呼び出される（typeあり）', () => {
      const data = { sessionId: 'session-123', message: 'Info message', type: 'info' };
      const sessionId = 'session-123';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledTimes(1);
      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });

    it('情報ハンドラーが呼び出される（typeなし）', () => {
      const data = { sessionId: 'session-123', message: 'Info message' };
      const sessionId = 'session-123';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledTimes(1);
      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });

    it('コンソールにログが出力される', () => {
      const data = { sessionId: 'session-123', message: 'Test info', type: 'warning' };
      const sessionId = 'session-123';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Received Q info for current session:',
        data
      );
    });

    it('空のメッセージでもハンドラーが呼び出される', () => {
      const data = { sessionId: 'session-123', message: '', type: 'info' };
      const sessionId = 'session-123';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });

    it('長いメッセージでも正常に処理される', () => {
      const longMessage = 'This is a very long information message that contains detailed instructions or updates about the current process. '.repeat(10);
      const data = { sessionId: 'session-123', message: longMessage, type: 'info' };
      const sessionId = 'session-123';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });

    it('特殊文字を含むメッセージを正常に処理する', () => {
      const specialMessage = '情報: プロセスが完了しました ✅ <div>HTML content</div>';
      const data = { sessionId: 'session-123', message: specialMessage, type: 'success' };
      const sessionId = 'session-123';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });
  });

  describe('セッションIDが一致しない場合', () => {
    it('情報ハンドラーが呼び出されない', () => {
      const data = { sessionId: 'session-123', message: 'Info message', type: 'info' };
      const sessionId = 'session-456';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).not.toHaveBeenCalled();
    });

    it('コンソールにログが出力されない', () => {
      const data = { sessionId: 'session-123', message: 'Test info' };
      const sessionId = 'session-456';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('空のセッションIDでも正しく判定される', () => {
      const data = { sessionId: '', message: 'Info message' };
      const sessionId = 'session-123';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).not.toHaveBeenCalled();
    });

    it('nullやundefinedのセッションIDを適切に処理する', () => {
      const data = { sessionId: null as any, message: 'Info message' };
      const sessionId = 'session-123';

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).not.toHaveBeenCalled();
    });
  });

  describe('typeプロパティの処理', () => {
    const sessionId = 'session-123';

    it('typeが未定義の場合でも正常に処理される', () => {
      const data = { sessionId, message: 'Message without type' };

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });

    it('typeが空文字列の場合でも正常に処理される', () => {
      const data = { sessionId, message: 'Message with empty type', type: '' };

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });

    it('様々なtypeの値を正常に処理する', () => {
      const types = ['info', 'warning', 'error', 'success', 'debug', 'trace'];
      
      types.forEach((type, index) => {
        const data = { sessionId, message: `Message ${index}`, type };
        handleInfoResponse(data, sessionId, mockOnHandleInfo);
      });

      expect(mockOnHandleInfo).toHaveBeenCalledTimes(types.length);
      types.forEach((type, index) => {
        expect(mockOnHandleInfo).toHaveBeenNthCalledWith(index + 1, {
          sessionId,
          message: `Message ${index}`,
          type
        });
      });
    });

    it('typeに特殊文字が含まれていても正常に処理される', () => {
      const data = { sessionId, message: 'Special type message', type: 'custom-type_123!@#' };

      handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });
  });

  describe('データの完全性', () => {
    const sessionId = 'session-123';

    it('元のデータオブジェクトがそのまま渡される', () => {
      const originalData = { 
        sessionId, 
        message: 'Original message', 
        type: 'info',
        // 追加のプロパティがあっても保持される
        extraProperty: 'extra value'
      } as any;

      handleInfoResponse(originalData, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledWith(originalData);
      // 参照が同じかどうかを確認
      expect(mockOnHandleInfo.mock.calls[0][0]).toBe(originalData);
    });

    it('ネストしたオブジェクトを含むデータも正常に処理される', () => {
      const complexData = {
        sessionId,
        message: 'Complex message',
        type: 'info',
        metadata: {
          timestamp: Date.now(),
          source: 'test',
          details: ['detail1', 'detail2']
        }
      } as any;

      handleInfoResponse(complexData, sessionId, mockOnHandleInfo);

      expect(mockOnHandleInfo).toHaveBeenCalledWith(complexData);
    });
  });

  describe('onHandleInfo関数のエラーハンドリング', () => {
    const sessionId = 'session-123';

    it('onHandleInfoが例外を投げた場合、エラーが伝播される', () => {
      const data = { sessionId, message: 'Test message' };
      const error = new Error('Handler error');
      
      mockOnHandleInfo.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        handleInfoResponse(data, sessionId, mockOnHandleInfo);
      }).toThrow(error);
    });

    it('onHandleInfoが非同期処理を行っても関数は同期的に完了する', () => {
      const data = { sessionId, message: 'Test message' };
      
      mockOnHandleInfo.mockImplementation(() => {
        setTimeout(() => {
          // 非同期処理
        }, 0);
      });

      expect(() => {
        handleInfoResponse(data, sessionId, mockOnHandleInfo);
      }).not.toThrow();

      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });
  });

  describe('複数の情報メッセージの連続処理', () => {
    const sessionId = 'session-123';

    it('同じセッションの複数情報を順次処理する', () => {
      const messages = [
        { sessionId, message: 'Step 1 completed', type: 'info' },
        { sessionId, message: 'Processing...', type: 'progress' },
        { sessionId, message: 'Step 2 completed', type: 'info' },
        { sessionId, message: 'All done!', type: 'success' }
      ];

      messages.forEach(data => {
        handleInfoResponse(data, sessionId, mockOnHandleInfo);
      });

      expect(mockOnHandleInfo).toHaveBeenCalledTimes(4);
      messages.forEach((expectedData, index) => {
        expect(mockOnHandleInfo).toHaveBeenNthCalledWith(index + 1, expectedData);
      });
    });

    it('混在するセッションIDからの情報を適切にフィルタリングする', () => {
      const currentSessionId = 'current-session';
      const otherSessionId = 'other-session';
      
      const messages = [
        { sessionId: currentSessionId, message: 'Current session info 1' },
        { sessionId: otherSessionId, message: 'Other session info' },
        { sessionId: currentSessionId, message: 'Current session info 2' }
      ];

      messages.forEach(data => {
        handleInfoResponse(data, currentSessionId, mockOnHandleInfo);
      });

      expect(mockOnHandleInfo).toHaveBeenCalledTimes(2);
      expect(mockOnHandleInfo).toHaveBeenNthCalledWith(1, messages[0]);
      expect(mockOnHandleInfo).toHaveBeenNthCalledWith(2, messages[2]);
    });
  });

  describe('パフォーマンス', () => {
    it('大量の情報処理でも効率的に動作する', () => {
      const sessionId = 'session-123';

      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const data = { sessionId, message: `Info message ${i}`, type: 'info' };
        handleInfoResponse(data, sessionId, mockOnHandleInfo);
      }
      
      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms以内
      expect(mockOnHandleInfo).toHaveBeenCalledTimes(1000);
    });

    it('大きなデータオブジェクトでも効率的に処理される', () => {
      const largeMessage = 'x'.repeat(100000);
      const data = { sessionId: 'session-123', message: largeMessage, type: 'info' };

      const start = performance.now();
      handleInfoResponse(data, 'session-123', mockOnHandleInfo);
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // 10ms以内
      expect(mockOnHandleInfo).toHaveBeenCalledWith(data);
    });
  });

  describe('戻り値', () => {
    it('関数の戻り値がvoidである', () => {
      const data = { sessionId: 'session-123', message: 'Test message' };
      const sessionId = 'session-123';

      const result = handleInfoResponse(data, sessionId, mockOnHandleInfo);

      expect(result).toBeUndefined();
    });
  });

  describe('実際の使用シナリオ', () => {
    it('プログレス情報の更新をシミュレート', () => {
      const sessionId = 'progress-session';
      const progressUpdates = [
        { sessionId, message: 'Starting process...', type: 'info' },
        { sessionId, message: 'Processing files... (25%)', type: 'progress' },
        { sessionId, message: 'Processing files... (50%)', type: 'progress' },
        { sessionId, message: 'Processing files... (75%)', type: 'progress' },
        { sessionId, message: 'Process completed successfully!', type: 'success' }
      ];

      progressUpdates.forEach(update => {
        handleInfoResponse(update, sessionId, mockOnHandleInfo);
      });

      expect(mockOnHandleInfo).toHaveBeenCalledTimes(5);
      progressUpdates.forEach((update, index) => {
        expect(mockOnHandleInfo).toHaveBeenNthCalledWith(index + 1, update);
      });
    });
  });
});