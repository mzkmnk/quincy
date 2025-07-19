import { handleCompletionResponse } from '../handle-completion-response';

describe('handleCompletionResponse', () => {
  let mockOnHandleCompletion: ReturnType<typeof vi.fn>;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockOnHandleCompletion = vi.fn();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    consoleSpy.mockRestore();
  });

  describe('セッションIDが一致する場合', () => {
    it('完了ハンドラーが呼び出される', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
      expect(mockOnHandleCompletion).toHaveBeenCalledWith();
    });

    it('コンソールにログが出力される', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Q session completed for current session:',
        data
      );
    });

    it('データオブジェクトに追加プロパティがあっても正常に処理される', () => {
      const data = { 
        sessionId: 'session-123',
        timestamp: Date.now(),
        metadata: { source: 'test' }
      } as any;
      const sessionId = 'session-123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Q session completed for current session:',
        data
      );
    });
  });

  describe('セッションIDが一致しない場合', () => {
    it('完了ハンドラーが呼び出されない', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-456';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).not.toHaveBeenCalled();
    });

    it('コンソールにログが出力されない', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-456';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('空のセッションIDでも正しく判定される', () => {
      const data = { sessionId: '' };
      const sessionId = 'session-123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).not.toHaveBeenCalled();
    });

    it('nullやundefinedのセッションIDを適切に処理する', () => {
      const data = { sessionId: null as any };
      const sessionId = 'session-123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).not.toHaveBeenCalled();
    });
  });

  describe('セッションIDの比較', () => {
    it('数値文字列のセッションIDでも正しく比較される', () => {
      const data = { sessionId: '123' };
      const sessionId = '123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
    });

    it('特殊文字を含むセッションIDでも正しく比較される', () => {
      const specialSessionId = 'session-123-$%^&*()_+-=[]{}|;:,.<>?';
      const data = { sessionId: specialSessionId };

      handleCompletionResponse(data, specialSessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
    });

    it('非常に長いセッションIDでも正しく比較される', () => {
      const longSessionId = 'session-' + 'a'.repeat(1000);
      const data = { sessionId: longSessionId };

      handleCompletionResponse(data, longSessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
    });

    it('Unicode文字を含むセッションIDでも正しく比較される', () => {
      const unicodeSessionId = 'セッション-123-🚀';
      const data = { sessionId: unicodeSessionId };

      handleCompletionResponse(data, unicodeSessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
    });

    it('大文字小文字が異なる場合は一致しないと判定される', () => {
      const data = { sessionId: 'Session-123' };
      const sessionId = 'session-123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).not.toHaveBeenCalled();
    });
  });

  describe('onHandleCompletion関数のエラーハンドリング', () => {
    it('onHandleCompletionが例外を投げた場合、エラーが伝播される', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-123';
      const error = new Error('Completion handler error');
      
      mockOnHandleCompletion.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        handleCompletionResponse(data, sessionId, mockOnHandleCompletion);
      }).toThrow(error);
    });

    it('onHandleCompletionが非同期処理を行っても関数は同期的に完了する', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-123';
      
      mockOnHandleCompletion.mockImplementation(() => {
        setTimeout(() => {
          // 非同期処理
        }, 0);
      });

      expect(() => {
        handleCompletionResponse(data, sessionId, mockOnHandleCompletion);
      }).not.toThrow();

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
    });

    it('onHandleCompletionがPromiseを返しても問題ない', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-123';
      
      mockOnHandleCompletion.mockReturnValue(Promise.resolve());

      expect(() => {
        handleCompletionResponse(data, sessionId, mockOnHandleCompletion);
      }).not.toThrow();

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
    });
  });

  describe('複数の完了イベントの処理', () => {
    it('同じセッションの複数完了イベントを順次処理する', () => {
      const sessionId = 'session-123';
      const completionEvents = [
        { sessionId },
        { sessionId },
        { sessionId }
      ];

      completionEvents.forEach(data => {
        handleCompletionResponse(data, sessionId, mockOnHandleCompletion);
      });

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(3);
    });

    it('混在するセッションIDからの完了イベントを適切にフィルタリングする', () => {
      const currentSessionId = 'current-session';
      const otherSessionId = 'other-session';
      
      const completionEvents = [
        { sessionId: currentSessionId },
        { sessionId: otherSessionId },
        { sessionId: currentSessionId },
        { sessionId: otherSessionId },
        { sessionId: currentSessionId }
      ];

      completionEvents.forEach(data => {
        handleCompletionResponse(data, currentSessionId, mockOnHandleCompletion);
      });

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(3);
    });
  });

  describe('データオブジェクトの検証', () => {
    it('最小限のデータオブジェクト（sessionIdのみ）で正常に動作する', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
    });

    it('追加のプロパティを持つデータオブジェクトでも正常に動作する', () => {
      const data = {
        sessionId: 'session-123',
        timestamp: Date.now(),
        duration: 1500,
        status: 'success',
        metadata: {
          processedItems: 100,
          totalItems: 100
        }
      } as any;
      const sessionId = 'session-123';

      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Q session completed for current session:',
        data
      );
    });

    it('sessionIdプロパティが存在しない場合はエラーが発生する可能性がある', () => {
      const data = {} as any;
      const sessionId = 'session-123';

      // sessionIdプロパティがないため、undefinedとの比較になる
      handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(mockOnHandleCompletion).not.toHaveBeenCalled();
    });
  });

  describe('パフォーマンス', () => {
    it('大量の完了イベント処理でも効率的に動作する', () => {
      const sessionId = 'session-123';

      const start = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        const data = { sessionId };
        handleCompletionResponse(data, sessionId, mockOnHandleCompletion);
      }
      
      const end = performance.now();

      expect(end - start).toBeLessThan(50); // 50ms以内
      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1000);
    });

    it('複雑なデータオブジェクトでも効率的に処理される', () => {
      const complexData = {
        sessionId: 'session-123',
        results: new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` })),
        statistics: {
          processed: 1000,
          failed: 0,
          duration: 5000
        }
      } as any;

      const start = performance.now();
      handleCompletionResponse(complexData, 'session-123', mockOnHandleCompletion);
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // 10ms以内
      expect(mockOnHandleCompletion).toHaveBeenCalledTimes(1);
    });
  });

  describe('戻り値', () => {
    it('関数の戻り値がvoidである', () => {
      const data = { sessionId: 'session-123' };
      const sessionId = 'session-123';

      const result = handleCompletionResponse(data, sessionId, mockOnHandleCompletion);

      expect(result).toBeUndefined();
    });
  });

  describe('実際の使用シナリオ', () => {
    it('チャットセッションの完了処理をシミュレート', () => {
      const sessionId = 'chat-session-456';
      let sessionCompleted = false;
      
      const completionHandler = () => {
        sessionCompleted = true;
      };

      const data = { sessionId };
      handleCompletionResponse(data, sessionId, completionHandler);

      expect(sessionCompleted).toBe(true);
    });

    it('複数セッションの並行処理で適切なセッションのみ完了する', () => {
      const session1Id = 'session-1';
      const session2Id = 'session-2';
      const session3Id = 'session-3';
      
      const session1Completed = false;
      const session2Completed = false;
      const session3Completed = false;

      const createCompletionHandler = (sessionRef: { completed: boolean }) => 
        () => { sessionRef.completed = true; };

      // セッション1の完了ハンドラー
      const session1Ref = { completed: false };
      const session1Handler = createCompletionHandler(session1Ref);

      // 各セッションの完了イベントを送信
      handleCompletionResponse({ sessionId: session1Id }, session1Id, session1Handler);
      handleCompletionResponse({ sessionId: session2Id }, session1Id, session1Handler); // 異なるセッション
      handleCompletionResponse({ sessionId: session3Id }, session1Id, session1Handler); // 異なるセッション

      expect(session1Ref.completed).toBe(true);
    });

    it('完了イベントでのリソースクリーンアップをシミュレート', () => {
      const sessionId = 'cleanup-session';
      const resources = {
        timers: [1, 2, 3],
        connections: ['conn1', 'conn2'],
        listeners: ['listener1', 'listener2']
      };

      const cleanupHandler = () => {
        resources.timers = [];
        resources.connections = [];
        resources.listeners = [];
      };

      const data = { sessionId };
      handleCompletionResponse(data, sessionId, cleanupHandler);

      expect(resources.timers).toEqual([]);
      expect(resources.connections).toEqual([]);
      expect(resources.listeners).toEqual([]);
    });
  });
});