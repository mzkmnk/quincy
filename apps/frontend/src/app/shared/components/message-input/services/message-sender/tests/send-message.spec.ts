import { canSendMessage, sendMessage } from '../send-message';
import { ElementRef } from '@angular/core';

describe('message-sender', () => {
  describe('canSendMessage', () => {
    describe('送信可能なケース', () => {
      it('有効なメッセージで送信中でない場合、trueを返す', () => {
        expect(canSendMessage('Hello', false)).toBe(true);
        expect(canSendMessage('Test message', false)).toBe(true);
      });

      it('前後に空白があるメッセージでも、内容があれば送信可能', () => {
        expect(canSendMessage('  Hello  ', false)).toBe(true);
        expect(canSendMessage('\t\nTest\t\n', false)).toBe(true);
      });

      it('特殊文字を含むメッセージでも送信可能', () => {
        expect(canSendMessage('🚀 Hello World! @#$%', false)).toBe(true);
      });
    });

    describe('送信不可能なケース', () => {
      it('空のメッセージの場合、falseを返す', () => {
        expect(canSendMessage('', false)).toBe(false);
        expect(canSendMessage('', true)).toBe(false);
      });

      it('空白のみのメッセージの場合、falseを返す', () => {
        expect(canSendMessage('   ', false)).toBe(false);
        expect(canSendMessage('\t\n\r', false)).toBe(false);
      });

      it('送信中の場合、falseを返す', () => {
        expect(canSendMessage('Hello', true)).toBe(false);
        expect(canSendMessage('Valid message', true)).toBe(false);
      });

      it('空白のみで送信中の場合、falseを返す', () => {
        expect(canSendMessage('   ', true)).toBe(false);
      });
    });

    describe('エッジケース', () => {
      it('非常に長いメッセージでも送信可能', () => {
        const longMessage = 'A'.repeat(10000);
        expect(canSendMessage(longMessage, false)).toBe(true);
      });

      it('改行のみのメッセージは送信不可', () => {
        expect(canSendMessage('\n\n\n', false)).toBe(false);
      });
    });
  });

  describe('sendMessage', () => {
    let mockAppStore: any;
    let mockWebSocket: any;
    let mockMessageService: any;
    let mockMessageTextarea: ElementRef<HTMLTextAreaElement>;
    let mockSendingSignal: any;
    let mockMessageTextSignal: any;
    let mockMessageSentEmitter: any;
    let mockTextareaElement: any;

    beforeEach(() => {
      mockAppStore = {
        currentQSession: vi.fn().mockReturnValue({
          sessionId: 'test-session-123',
          projectPath: '/test/project'
        })
      };

      mockWebSocket = {
        sendQMessage: vi.fn().mockResolvedValue(undefined)
      };

      mockMessageService = {
        add: vi.fn()
      };

      mockTextareaElement = {
        style: {
          height: '60px'
        }
      };

      mockMessageTextarea = {
        nativeElement: mockTextareaElement
      } as ElementRef<HTMLTextAreaElement>;

      mockSendingSignal = {
        set: vi.fn()
      };

      mockMessageTextSignal = {
        set: vi.fn()
      };

      mockMessageSentEmitter = {
        emit: vi.fn()
      };

      // console.logとconsole.errorをモック
      vi.spyOn(console, 'log').mockImplementation(() => {});
      vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('正常なメッセージ送信', () => {
      it('正常にメッセージを送信する', async () => {
        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(mockSendingSignal.set).toHaveBeenCalledWith(true);
        expect(mockMessageSentEmitter.emit).toHaveBeenCalledWith({ content: 'Hello World' });
        expect(mockWebSocket.sendQMessage).toHaveBeenCalledWith('test-session-123', 'Hello World');
        expect(mockMessageTextSignal.set).toHaveBeenCalledWith('');
        expect(mockTextareaElement.style.height).toBe('auto');
        expect(mockSendingSignal.set).toHaveBeenCalledWith(false);
      });

      it('前後の空白を削除してメッセージを送信する', async () => {
        await sendMessage(
          '  Hello World  ',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(mockMessageSentEmitter.emit).toHaveBeenCalledWith({ content: 'Hello World' });
        expect(mockWebSocket.sendQMessage).toHaveBeenCalledWith('test-session-123', 'Hello World');
      });

      it('特殊文字を含むメッセージを正常に送信する', async () => {
        const specialMessage = '🚀 Hello! @#$% こんにちは 123';
        
        await sendMessage(
          specialMessage,
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(mockMessageSentEmitter.emit).toHaveBeenCalledWith({ content: specialMessage });
        expect(mockWebSocket.sendQMessage).toHaveBeenCalledWith('test-session-123', specialMessage);
      });
    });

    describe('セッション状態の処理', () => {
      it('アクティブセッションがない場合、送信をスキップする', async () => {
        mockAppStore.currentQSession.mockReturnValue(null);

        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(console.error).toHaveBeenCalledWith('No active session to send message to');
        expect(mockWebSocket.sendQMessage).not.toHaveBeenCalled();
        expect(mockMessageSentEmitter.emit).not.toHaveBeenCalled();
      });

      it('セッションがundefinedの場合、送信をスキップする', async () => {
        mockAppStore.currentQSession.mockReturnValue(undefined);

        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(console.error).toHaveBeenCalledWith('No active session to send message to');
        expect(mockWebSocket.sendQMessage).not.toHaveBeenCalled();
      });
    });

    describe('エラーハンドリング', () => {
      it('WebSocket送信エラー時に適切なエラー処理を行う', async () => {
        const error = new Error('WebSocket error');
        mockWebSocket.sendQMessage.mockRejectedValue(error);

        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(console.error).toHaveBeenCalledWith('Failed to send message:', error);
        expect(mockMessageService.add).toHaveBeenCalledWith({
          severity: 'error',
          summary: 'エラー',
          detail: 'メッセージの送信に失敗しました',
          life: 5000
        });
        expect(mockSendingSignal.set).toHaveBeenCalledWith(false);
      });

      it('例外発生時でも適切にクリーンアップする', async () => {
        mockMessageSentEmitter.emit.mockImplementation(() => {
          throw new Error('Emit error');
        });

        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(mockSendingSignal.set).toHaveBeenCalledWith(false);
        expect(mockMessageService.add).toHaveBeenCalled();
      });
    });

    describe('UI状態の更新', () => {
      it('送信状態を正しく管理する', async () => {
        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        // 送信開始時にtrueを設定
        expect(mockSendingSignal.set).toHaveBeenNthCalledWith(1, true);
        // 送信完了後にfalseを設定
        expect(mockSendingSignal.set).toHaveBeenNthCalledWith(2, false);
      });

      it('メッセージテキストをクリアする', async () => {
        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(mockMessageTextSignal.set).toHaveBeenCalledWith('');
      });

      it('テキストエリアの高さをリセットする', async () => {
        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(mockTextareaElement.style.height).toBe('auto');
      });

      it('テキストエリアがnullの場合でもエラーにならない', async () => {
        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          null as any,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(mockWebSocket.sendQMessage).toHaveBeenCalled();
        expect(mockSendingSignal.set).toHaveBeenCalledWith(false);
      });
    });

    describe('ログ出力', () => {
      it('メッセージ送信時にログを出力する', async () => {
        await sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        expect(console.log).toHaveBeenCalledWith('Sending message to Amazon Q:', 'Hello World');
      });
    });

    describe('非同期処理', () => {
      it('WebSocket送信の完了を待つ', async () => {
        let resolveWebSocket: () => void;
        const webSocketPromise = new Promise<void>((resolve) => {
          resolveWebSocket = resolve;
        });
        
        mockWebSocket.sendQMessage.mockReturnValue(webSocketPromise);

        const sendPromise = sendMessage(
          'Hello World',
          mockAppStore,
          mockWebSocket,
          mockMessageService,
          mockMessageTextarea,
          mockSendingSignal,
          mockMessageTextSignal,
          mockMessageSentEmitter
        );

        // WebSocket送信が完了する前は送信中状態
        expect(mockSendingSignal.set).toHaveBeenCalledWith(true);
        expect(mockSendingSignal.set).not.toHaveBeenCalledWith(false);

        resolveWebSocket!();
        await sendPromise;

        // WebSocket送信完了後は送信完了状態
        expect(mockSendingSignal.set).toHaveBeenCalledWith(false);
      });
    });
  });
});