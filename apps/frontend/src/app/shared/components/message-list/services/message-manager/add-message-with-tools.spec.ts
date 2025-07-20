/**
 * ツール情報対応メッセージ追加機能のテスト (TDD Red)
 */

import type { AppStore } from '../../../../../core/store/app.state';
import type { ToolList } from '../../../../../core/types/tool-display.types';

import { addMessageWithTools } from './add-message-with-tools';

describe('addMessageWithTools', () => {
  let mockAppStore: Partial<AppStore>;
  let mockScrollToBottomRequest: { set: (value: boolean) => void };
  let mockCurrentSession: { sessionId: string };

  beforeEach(() => {
    mockCurrentSession = { sessionId: 'q_session_123' };

    mockAppStore = {
      currentQSession: () => mockCurrentSession,
      addChatMessage: vi.fn(),
    } as unknown as AppStore;

    mockScrollToBottomRequest = {
      set: vi.fn(),
    };
  });

  describe('TDD Red: ツール情報を含むメッセージ追加', () => {
    test('ツール情報付きでアシスタントメッセージを追加する', () => {
      const content = 'ファイルを確認しました';
      const tools: ToolList = ['fs_read', 'github_mcp'];
      const hasToolContent = true;

      const messageId = addMessageWithTools(
        content,
        'assistant',
        mockAppStore as AppStore,
        mockScrollToBottomRequest,
        tools,
        hasToolContent
      );

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content,
        sender: 'assistant',
        timestamp: expect.any(Date),
        sessionId: 'q_session_123',
        tools,
        hasToolContent,
      });
      expect(mockScrollToBottomRequest.set).toHaveBeenCalledWith(true);
      expect(messageId).toMatch(/^msg_\d+-[a-z0-9]+$/);
    });

    test('ツール情報なしでユーザーメッセージを追加する', () => {
      const content = 'こんにちは';

      const messageId = addMessageWithTools(
        content,
        'user',
        mockAppStore as AppStore,
        mockScrollToBottomRequest
      );

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content,
        sender: 'user',
        timestamp: expect.any(Date),
        sessionId: 'q_session_123',
        tools: undefined,
        hasToolContent: undefined,
      });
      expect(mockScrollToBottomRequest.set).toHaveBeenCalledWith(true);
    });

    test('空のツールリストを適切に処理する', () => {
      const content = 'レスポンス';
      const tools: ToolList = [];
      const hasToolContent = false;

      const messageId = addMessageWithTools(
        content,
        'assistant',
        mockAppStore as AppStore,
        mockScrollToBottomRequest,
        tools,
        hasToolContent
      );

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content,
        sender: 'assistant',
        timestamp: expect.any(Date),
        sessionId: 'q_session_123',
        tools,
        hasToolContent,
      });
    });

    test('セッションIDがない場合の処理', () => {
      (mockAppStore as unknown as { currentQSession: () => null }).currentQSession = () => null;
      const content = 'テストメッセージ';

      const messageId = addMessageWithTools(
        content,
        'user',
        mockAppStore as AppStore,
        mockScrollToBottomRequest
      );

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content,
        sender: 'user',
        timestamp: expect.any(Date),
        sessionId: undefined,
        tools: undefined,
        hasToolContent: undefined,
      });
    });
  });

  describe('TDD Red: エラーハンドリングとエッジケース', () => {
    test('不正なツールデータでも安全に処理する', () => {
      const content = 'テストメッセージ';
      const invalidTools = 'invalid' as unknown as ToolList;
      const invalidHasToolContent = 'invalid' as unknown as boolean;

      const messageId = addMessageWithTools(
        content,
        'assistant',
        mockAppStore as AppStore,
        mockScrollToBottomRequest,
        invalidTools,
        invalidHasToolContent
      );

      expect(mockAppStore.addChatMessage).toHaveBeenCalledWith({
        id: messageId,
        content,
        sender: 'assistant',
        timestamp: expect.any(Date),
        sessionId: 'q_session_123',
        tools: invalidTools,
        hasToolContent: invalidHasToolContent,
      });
    });

    test('メッセージIDの一意性', () => {
      const messageId1 = addMessageWithTools(
        'メッセージ1',
        'user',
        mockAppStore as AppStore,
        mockScrollToBottomRequest
      );

      const messageId2 = addMessageWithTools(
        'メッセージ2',
        'user',
        mockAppStore as AppStore,
        mockScrollToBottomRequest
      );

      expect(messageId1).not.toBe(messageId2);
    });
  });
});
