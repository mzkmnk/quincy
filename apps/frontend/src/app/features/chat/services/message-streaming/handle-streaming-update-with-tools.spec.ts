/**
 * ツール情報対応ストリーミングアップデート処理のテスト (TDD Red)
 */

import type { ChatMessage } from '../../../../core/store/chat/chat.state';

import { handleStreamingUpdateWithTools } from './handle-streaming-update-with-tools';

describe('handleStreamingUpdateWithTools', () => {
  let getCurrentMessagesMock: ReturnType<typeof vi.fn>;
  let updateChatMessageMock: ReturnType<typeof vi.fn>;
  let markForScrollUpdateMock: ReturnType<typeof vi.fn>;
  let updateMessageIndexMapMock: ReturnType<typeof vi.fn>;
  let messageIndexMap: Map<string, number>;

  beforeEach(() => {
    getCurrentMessagesMock = vi.fn();
    updateChatMessageMock = vi.fn();
    markForScrollUpdateMock = vi.fn();
    updateMessageIndexMapMock = vi.fn();
    messageIndexMap = new Map();
  });

  describe('TDD Red: ツール情報を含むストリーミング更新処理', () => {
    test('コンテンツとツール情報を同時に更新する', () => {
      const streamingMessageId = 'msg_123';
      const existingMessage: ChatMessage = {
        id: streamingMessageId,
        content: '初期コンテンツ',
        sender: 'assistant',
        timestamp: new Date(),
        tools: ['existing_tool'],
        hasToolContent: true,
      };

      messageIndexMap.set(streamingMessageId, 0);
      getCurrentMessagesMock.mockReturnValue([existingMessage]);

      handleStreamingUpdateWithTools(
        '追加コンテンツ',
        ['new_tool'],
        true,
        streamingMessageId,
        messageIndexMap,
        getCurrentMessagesMock,
        updateChatMessageMock,
        markForScrollUpdateMock,
        updateMessageIndexMapMock
      );

      expect(updateChatMessageMock).toHaveBeenCalledWith(streamingMessageId, {
        content: '初期コンテンツ追加コンテンツ',
        tools: ['existing_tool', 'new_tool'],
        hasToolContent: true,
      });
      expect(markForScrollUpdateMock).toHaveBeenCalled();
    });

    test('コンテンツのみ更新（ツール情報なし）', () => {
      const streamingMessageId = 'msg_123';
      const existingMessage: ChatMessage = {
        id: streamingMessageId,
        content: '初期コンテンツ',
        sender: 'assistant',
        timestamp: new Date(),
      };

      messageIndexMap.set(streamingMessageId, 0);
      getCurrentMessagesMock.mockReturnValue([existingMessage]);

      handleStreamingUpdateWithTools(
        '追加コンテンツ',
        undefined,
        false,
        streamingMessageId,
        messageIndexMap,
        getCurrentMessagesMock,
        updateChatMessageMock,
        markForScrollUpdateMock,
        updateMessageIndexMapMock
      );

      expect(updateChatMessageMock).toHaveBeenCalledWith(streamingMessageId, {
        content: '初期コンテンツ追加コンテンツ',
      });
      expect(markForScrollUpdateMock).toHaveBeenCalled();
    });

    test('重複ツールの排除処理', () => {
      const streamingMessageId = 'msg_123';
      const existingMessage: ChatMessage = {
        id: streamingMessageId,
        content: '初期コンテンツ',
        sender: 'assistant',
        timestamp: new Date(),
        tools: ['fs_read', 'github_mcp'],
        hasToolContent: true,
      };

      messageIndexMap.set(streamingMessageId, 0);
      getCurrentMessagesMock.mockReturnValue([existingMessage]);

      handleStreamingUpdateWithTools(
        '追加コンテンツ',
        ['fs_read', 'new_tool'], // 重複するfs_readを含む
        true,
        streamingMessageId,
        messageIndexMap,
        getCurrentMessagesMock,
        updateChatMessageMock,
        markForScrollUpdateMock,
        updateMessageIndexMapMock
      );

      expect(updateChatMessageMock).toHaveBeenCalledWith(streamingMessageId, {
        content: '初期コンテンツ追加コンテンツ',
        tools: ['fs_read', 'github_mcp', 'new_tool'], // 重複排除済み
        hasToolContent: true,
      });
    });

    test('インデックスマップが古い場合の再構築処理', () => {
      const streamingMessageId = 'msg_123';
      const existingMessage: ChatMessage = {
        id: streamingMessageId,
        content: '初期コンテンツ',
        sender: 'assistant',
        timestamp: new Date(),
        tools: ['existing_tool'],
        hasToolContent: true,
      };

      // インデックスマップを意図的に空にして、再構築をトリガー
      messageIndexMap.clear();
      getCurrentMessagesMock.mockReturnValue([existingMessage]);

      // 再構築後にインデックスが設定される想定
      updateMessageIndexMapMock.mockImplementation(() => {
        messageIndexMap.set(streamingMessageId, 0);
      });

      handleStreamingUpdateWithTools(
        '追加コンテンツ',
        ['new_tool'],
        true,
        streamingMessageId,
        messageIndexMap,
        getCurrentMessagesMock,
        updateChatMessageMock,
        markForScrollUpdateMock,
        updateMessageIndexMapMock
      );

      expect(updateMessageIndexMapMock).toHaveBeenCalled();
      expect(updateChatMessageMock).toHaveBeenCalledWith(streamingMessageId, {
        content: '初期コンテンツ追加コンテンツ',
        tools: ['existing_tool', 'new_tool'],
        hasToolContent: true,
      });
    });
  });

  describe('TDD Red: エラーハンドリングとエッジケース', () => {
    test('存在しないメッセージIDの場合は処理しない', () => {
      const streamingMessageId = 'nonexistent_msg';
      messageIndexMap.set(streamingMessageId, 0);
      getCurrentMessagesMock.mockReturnValue([]);

      handleStreamingUpdateWithTools(
        '追加コンテンツ',
        ['new_tool'],
        true,
        streamingMessageId,
        messageIndexMap,
        getCurrentMessagesMock,
        updateChatMessageMock,
        markForScrollUpdateMock,
        updateMessageIndexMapMock
      );

      expect(updateChatMessageMock).not.toHaveBeenCalled();
      expect(markForScrollUpdateMock).not.toHaveBeenCalled();
    });

    test('空のツールリストの場合', () => {
      const streamingMessageId = 'msg_123';
      const existingMessage: ChatMessage = {
        id: streamingMessageId,
        content: '初期コンテンツ',
        sender: 'assistant',
        timestamp: new Date(),
        tools: ['existing_tool'],
        hasToolContent: true,
      };

      messageIndexMap.set(streamingMessageId, 0);
      getCurrentMessagesMock.mockReturnValue([existingMessage]);

      handleStreamingUpdateWithTools(
        '追加コンテンツ',
        [],
        false,
        streamingMessageId,
        messageIndexMap,
        getCurrentMessagesMock,
        updateChatMessageMock,
        markForScrollUpdateMock,
        updateMessageIndexMapMock
      );

      expect(updateChatMessageMock).toHaveBeenCalledWith(streamingMessageId, {
        content: '初期コンテンツ追加コンテンツ',
        tools: ['existing_tool'], // 既存ツールは保持
        hasToolContent: true, // 既存ツールがあるためtrue
      });
    });
  });
});
