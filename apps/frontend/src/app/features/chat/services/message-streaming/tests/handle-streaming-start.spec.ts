import { signal } from '@angular/core';

import { handleStreamingStart } from '../handle-streaming-start';

describe('handleStreamingStart', () => {
  let mockAddMessage: ReturnType<typeof vi.fn>;
  let mockUpdateMessageIndexMap: ReturnType<typeof vi.fn>;
  let streamingMessageId: ReturnType<typeof signal<string | null>>;

  beforeEach(() => {
    mockAddMessage = vi.fn();
    mockUpdateMessageIndexMap = vi.fn();
    streamingMessageId = signal<string | null>(null);
    vi.clearAllMocks();
  });

  describe('基本機能', () => {
    it('addMessageが正しい引数で呼び出される', () => {
      const content = 'Initial streaming content';
      const messageId = 'msg-123';
      mockAddMessage.mockReturnValue(messageId);

      handleStreamingStart(content, mockAddMessage, streamingMessageId, mockUpdateMessageIndexMap);

      expect(mockAddMessage).toHaveBeenCalledTimes(1);
      expect(mockAddMessage).toHaveBeenCalledWith(content, 'assistant');
    });

    it('streamingMessageIdが正しく設定される', () => {
      const content = 'Test content';
      const messageId = 'msg-456';
      mockAddMessage.mockReturnValue(messageId);

      handleStreamingStart(content, mockAddMessage, streamingMessageId, mockUpdateMessageIndexMap);

      expect(streamingMessageId()).toBe(messageId);
    });

    it('updateMessageIndexMapが呼び出される', () => {
      const content = 'Test content';
      const messageId = 'msg-789';
      mockAddMessage.mockReturnValue(messageId);

      handleStreamingStart(content, mockAddMessage, streamingMessageId, mockUpdateMessageIndexMap);

      expect(mockUpdateMessageIndexMap).toHaveBeenCalledTimes(1);
      expect(mockUpdateMessageIndexMap).toHaveBeenCalledWith();
    });

    it('作成されたメッセージIDが返される', () => {
      const content = 'Test content';
      const expectedMessageId = 'msg-return-test';
      mockAddMessage.mockReturnValue(expectedMessageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(result).toBe(expectedMessageId);
    });

    it('処理の順序が正しい（addMessage → streamingMessageId設定 → updateMessageIndexMap）', () => {
      const content = 'Test content';
      const messageId = 'msg-sequence';
      mockAddMessage.mockReturnValue(messageId);

      let streamingMessageIdSetValue: string | null = null;
      let updateIndexMapCalled = false;

      // updateMessageIndexMapが呼ばれた時点でstreamingMessageIdが設定されているかチェック
      mockUpdateMessageIndexMap.mockImplementation(() => {
        streamingMessageIdSetValue = streamingMessageId();
        updateIndexMapCalled = true;
      });

      handleStreamingStart(content, mockAddMessage, streamingMessageId, mockUpdateMessageIndexMap);

      expect(mockAddMessage).toHaveBeenCalledBefore(mockUpdateMessageIndexMap as any);
      expect(updateIndexMapCalled).toBe(true);
      expect(streamingMessageIdSetValue).toBe(messageId);
    });
  });

  describe('様々なコンテンツでの動作', () => {
    it('空文字列のコンテンツでも正常に動作する', () => {
      const content = '';
      const messageId = 'msg-empty';
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(mockAddMessage).toHaveBeenCalledWith('', 'assistant');
      expect(streamingMessageId()).toBe(messageId);
      expect(result).toBe(messageId);
    });

    it('長いコンテンツでも正常に動作する', () => {
      const content = 'Long content: ' + 'x'.repeat(10000);
      const messageId = 'msg-long';
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(mockAddMessage).toHaveBeenCalledWith(content, 'assistant');
      expect(result).toBe(messageId);
    });

    it('特殊文字を含むコンテンツでも正常に動作する', () => {
      const content = 'Special chars: 🚀 日本語 <script>alert("test")</script> \n\t\r';
      const messageId = 'msg-special';
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(mockAddMessage).toHaveBeenCalledWith(content, 'assistant');
      expect(result).toBe(messageId);
    });

    it('改行を含むコンテンツでも正常に動作する', () => {
      const content = 'Line 1\nLine 2\nLine 3';
      const messageId = 'msg-multiline';
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(mockAddMessage).toHaveBeenCalledWith(content, 'assistant');
      expect(result).toBe(messageId);
    });

    it('JSONコンテンツでも正常に動作する', () => {
      const content = '{"type": "response", "data": {"message": "Hello"}}';
      const messageId = 'msg-json';
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(mockAddMessage).toHaveBeenCalledWith(content, 'assistant');
      expect(result).toBe(messageId);
    });
  });

  describe('様々なメッセージIDでの動作', () => {
    it('短いメッセージIDでも正常に動作する', () => {
      const content = 'Test';
      const messageId = '1';
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(streamingMessageId()).toBe(messageId);
      expect(result).toBe(messageId);
    });

    it('長いメッセージIDでも正常に動作する', () => {
      const content = 'Test';
      const messageId = 'very-long-message-id-' + 'x'.repeat(100);
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(streamingMessageId()).toBe(messageId);
      expect(result).toBe(messageId);
    });

    it('特殊文字を含むメッセージIDでも正常に動作する', () => {
      const content = 'Test';
      const messageId = 'msg-123-$%^&*()_+-=[]{}|;:,.<>?';
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(streamingMessageId()).toBe(messageId);
      expect(result).toBe(messageId);
    });

    it('空文字列のメッセージIDでも正常に動作する', () => {
      const content = 'Test';
      const messageId = '';
      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        content,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(streamingMessageId()).toBe(messageId);
      expect(result).toBe(messageId);
    });
  });

  describe('streamingMessageIdの状態変更', () => {
    it('初期値がnullから正しいIDに変更される', () => {
      expect(streamingMessageId()).toBeNull();

      const content = 'Test';
      const messageId = 'msg-initial';
      mockAddMessage.mockReturnValue(messageId);

      handleStreamingStart(content, mockAddMessage, streamingMessageId, mockUpdateMessageIndexMap);

      expect(streamingMessageId()).toBe(messageId);
    });

    it('既存の値が新しいIDで上書きされる', () => {
      streamingMessageId.set('old-message-id');
      expect(streamingMessageId()).toBe('old-message-id');

      const content = 'Test';
      const messageId = 'new-message-id';
      mockAddMessage.mockReturnValue(messageId);

      handleStreamingStart(content, mockAddMessage, streamingMessageId, mockUpdateMessageIndexMap);

      expect(streamingMessageId()).toBe(messageId);
    });

    it('複数回の呼び出しで正しく状態が更新される', () => {
      const calls = [
        { content: 'First', messageId: 'msg-1' },
        { content: 'Second', messageId: 'msg-2' },
        { content: 'Third', messageId: 'msg-3' },
      ];

      calls.forEach(call => {
        mockAddMessage.mockReturnValue(call.messageId);

        const result = handleStreamingStart(
          call.content,
          mockAddMessage,
          streamingMessageId,
          mockUpdateMessageIndexMap
        );

        expect(streamingMessageId()).toBe(call.messageId);
        expect(result).toBe(call.messageId);
      });

      expect(mockAddMessage).toHaveBeenCalledTimes(3);
      expect(mockUpdateMessageIndexMap).toHaveBeenCalledTimes(3);
    });
  });

  describe('エラーハンドリング', () => {
    it('addMessageがエラーを投げた場合、エラーが伝播される', () => {
      const content = 'Test';
      const error = new Error('addMessage failed');
      mockAddMessage.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        handleStreamingStart(
          content,
          mockAddMessage,
          streamingMessageId,
          mockUpdateMessageIndexMap
        );
      }).toThrow(error);

      // エラーが発生した場合、後続の処理は実行されない
      expect(streamingMessageId()).toBeNull();
      expect(mockUpdateMessageIndexMap).not.toHaveBeenCalled();
    });

    it('updateMessageIndexMapがエラーを投げた場合、エラーが伝播される', () => {
      const content = 'Test';
      const messageId = 'msg-error-test';
      const error = new Error('updateMessageIndexMap failed');

      mockAddMessage.mockReturnValue(messageId);
      mockUpdateMessageIndexMap.mockImplementation(() => {
        throw error;
      });

      expect(() => {
        handleStreamingStart(
          content,
          mockAddMessage,
          streamingMessageId,
          mockUpdateMessageIndexMap
        );
      }).toThrow(error);

      // addMessageとstreamingMessageId設定は完了している
      expect(mockAddMessage).toHaveBeenCalled();
      expect(streamingMessageId()).toBe(messageId);
    });

    it('streamingMessageId.setがエラーを投げた場合（理論的には発生しない）', () => {
      const content = 'Test';
      const messageId = 'msg-signal-error';
      mockAddMessage.mockReturnValue(messageId);

      // signalのsetメソッドは通常エラーを投げないが、テストのために模擬
      const originalSet = streamingMessageId.set;
      streamingMessageId.set = vi.fn().mockImplementation(() => {
        throw new Error('Signal set failed');
      });

      expect(() => {
        handleStreamingStart(
          content,
          mockAddMessage,
          streamingMessageId,
          mockUpdateMessageIndexMap
        );
      }).toThrow('Signal set failed');

      // 元のsetメソッドを復元
      streamingMessageId.set = originalSet;
    });
  });

  describe('並行呼び出しと競合状態', () => {
    it('短期間での複数呼び出しでも正しく動作する', () => {
      const calls = Array.from({ length: 10 }, (_, i) => ({
        content: `Content ${i}`,
        messageId: `msg-${i}`,
      }));

      const results: string[] = [];

      calls.forEach(call => {
        mockAddMessage.mockReturnValueOnce(call.messageId);
        const result = handleStreamingStart(
          call.content,
          mockAddMessage,
          streamingMessageId,
          mockUpdateMessageIndexMap
        );
        results.push(result);
      });

      expect(results).toEqual(calls.map(call => call.messageId));
      expect(streamingMessageId()).toBe('msg-9'); // 最後の呼び出しのID
      expect(mockAddMessage).toHaveBeenCalledTimes(10);
      expect(mockUpdateMessageIndexMap).toHaveBeenCalledTimes(10);
    });
  });

  describe('パフォーマンス', () => {
    it('大量の呼び出しでも効率的に動作する', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        mockAddMessage.mockReturnValue(`msg-${i}`);
        handleStreamingStart(
          `Content ${i}`,
          mockAddMessage,
          streamingMessageId,
          mockUpdateMessageIndexMap
        );
      }

      const end = performance.now();

      expect(end - start).toBeLessThan(100); // 100ms以内
      expect(mockAddMessage).toHaveBeenCalledTimes(1000);
      expect(mockUpdateMessageIndexMap).toHaveBeenCalledTimes(1000);
    });

    it('大きなコンテンツでも効率的に動作する', () => {
      const largeContent = 'Large content: ' + 'x'.repeat(100000);
      const messageId = 'msg-large';
      mockAddMessage.mockReturnValue(messageId);

      const start = performance.now();
      const result = handleStreamingStart(
        largeContent,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );
      const end = performance.now();

      expect(end - start).toBeLessThan(10); // 10ms以内
      expect(result).toBe(messageId);
    });
  });

  describe('実際の使用シナリオ', () => {
    it('チャットストリーミング開始をシミュレート', () => {
      const initialContent = 'AI is starting to respond...';
      const messageId = 'chat-msg-001';

      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        initialContent,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(mockAddMessage).toHaveBeenCalledWith(initialContent, 'assistant');
      expect(streamingMessageId()).toBe(messageId);
      expect(mockUpdateMessageIndexMap).toHaveBeenCalled();
      expect(result).toBe(messageId);

      // 実際のチャットではこの後、handleStreamingUpdateが呼ばれることになる
    });

    it('空のレスポンスから開始するシナリオ', () => {
      const initialContent = '';
      const messageId = 'empty-start-msg';

      mockAddMessage.mockReturnValue(messageId);

      const result = handleStreamingStart(
        initialContent,
        mockAddMessage,
        streamingMessageId,
        mockUpdateMessageIndexMap
      );

      expect(mockAddMessage).toHaveBeenCalledWith('', 'assistant');
      expect(result).toBe(messageId);
    });
  });
});
