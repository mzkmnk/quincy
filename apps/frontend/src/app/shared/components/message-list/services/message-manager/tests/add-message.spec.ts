import { signal } from '@angular/core';
import type { MockedFunction } from 'vitest';

import { addMessage } from '../add-message';
import type { AppStore } from '../../../../../../core/store/app.state';

describe('addMessage', () => {
  let mockAppStore: Partial<AppStore> & {
    currentQSession: { set: (value: { sessionId?: string } | null) => void };
    addChatMessage: (message: { id: string; content: string; sender: string; timestamp: Date; sessionId?: string }) => void;
  };
  let mockScrollToBottomRequest: { set: (value: boolean) => void };

  beforeEach(() => {
    mockAppStore = {
      currentQSession: signal({ sessionId: 'test-session-123' }),
      addChatMessage: vi.fn(),
    } as unknown as Partial<AppStore> & {
      currentQSession: { set: (value: { sessionId?: string } | null) => void };
      addChatMessage: (message: { id: string; content: string; sender: string; timestamp: Date; sessionId?: string }) => void;
    };

    mockScrollToBottomRequest = {
      set: vi.fn(),
    };
  });

  describe('基本機能', () => {
    it('ユーザーメッセージを正しく追加する', () => {
      const messageId = addMessage('Hello', 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);

      expect(messageId).toBeTruthy();
      expect(typeof messageId).toBe('string');
      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content: 'Hello',
        sender: 'user',
        timestamp: expect.any(Date),
        sessionId: 'test-session-123',
      });
      expect(mockScrollToBottomRequest.set).toHaveBeenCalledWith(true);
    });

    it('アシスタントメッセージを正しく追加する', () => {
      const messageId = addMessage(
        'Hi there!',
        'assistant',
        mockAppStore as unknown as AppStore,
        mockScrollToBottomRequest
      );

      expect(messageId).toBeTruthy();
      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content: 'Hi there!',
        sender: 'assistant',
        timestamp: expect.any(Date),
        sessionId: 'test-session-123',
      });
    });
  });

  describe('セッション状態の処理', () => {
    it('セッションがnullの場合でもメッセージを追加する', () => {
      mockAppStore.currentQSession.set(null);

      const messageId = addMessage('Message', 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content: 'Message',
        sender: 'user',
        timestamp: expect.any(Date),
        sessionId: undefined,
      });
    });

    it('セッションIDがない場合でもメッセージを追加する', () => {
      mockAppStore.currentQSession.set({});

      const messageId = addMessage('Message', 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content: 'Message',
        sender: 'user',
        timestamp: expect.any(Date),
        sessionId: undefined,
      });
    });
  });

  describe('メッセージIDの生成', () => {
    it('一意のメッセージIDを生成する', () => {
      const messageId1 = addMessage('Message 1', 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);
      const messageId2 = addMessage('Message 2', 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);

      expect(messageId1).not.toBe(messageId2);
      expect(messageId1).toMatch(/^\d+-[a-z0-9]{7}$/);
      expect(messageId2).toMatch(/^\d+-[a-z0-9]{7}$/);
    });

    it('複数回呼び出しでも一意性を保つ', () => {
      const messageIds = new Set();

      for (let i = 0; i < 100; i++) {
        const id = addMessage(`Message ${i}`, 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);
        expect(messageIds.has(id)).toBe(false);
        messageIds.add(id);
      }

      expect(messageIds.size).toBe(100);
    });
  });

  describe('タイムスタンプの処理', () => {
    it('現在時刻のタイムスタンプを設定する', () => {
      const beforeTime = new Date();
      addMessage('Message', 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);
      const afterTime = new Date();

      const callArgs = (mockAppStore.addChatMessage as MockedFunction<(message: { id: string; content: string; sender: string; timestamp: Date; sessionId?: string }) => void>).mock.calls[0][0];
      expect(callArgs.timestamp).toBeInstanceOf(Date);
      expect(callArgs.timestamp.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(callArgs.timestamp.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('スクロール制御', () => {
    it('メッセージ追加後にスクロール要求を送信する', () => {
      addMessage('Message', 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);

      expect(mockScrollToBottomRequest.set).toHaveBeenCalledWith(true);
      expect(mockScrollToBottomRequest.set).toHaveBeenCalledTimes(1);
    });
  });

  describe('エッジケース', () => {
    it('空のコンテンツでもメッセージを追加する', () => {
      const messageId = addMessage('', 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content: '',
        sender: 'user',
        timestamp: expect.any(Date),
        sessionId: 'test-session-123',
      });
    });

    it('非常に長いコンテンツでもメッセージを追加する', () => {
      const longContent = 'A'.repeat(10000);
      const messageId = addMessage(longContent, 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content: longContent,
        sender: 'user',
        timestamp: expect.any(Date),
        sessionId: 'test-session-123',
      });
    });

    it('特殊文字を含むコンテンツでもメッセージを追加する', () => {
      const specialContent = '🚀 こんにちは！ <script>alert("test")</script>';
      const messageId = addMessage(
        specialContent,
        'assistant',
        mockAppStore as unknown as AppStore,
        mockScrollToBottomRequest
      );

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content: specialContent,
        sender: 'assistant',
        timestamp: expect.any(Date),
        sessionId: 'test-session-123',
      });
    });
  });

  describe('パフォーマンス', () => {
    it('大量のメッセージ追加でも効率的に動作する', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        addMessage(`Message ${i}`, 'user', mockAppStore as unknown as AppStore, mockScrollToBottomRequest);
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(100); // 100ms以内
      expect(mockAppStore.addChatMessage).toHaveBeenCalledTimes(1000);
    });
  });
});
