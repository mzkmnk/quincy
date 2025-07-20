/**
 * WebSocketメッセージ型のツール拡張テスト (TDD Red→Green)
 */

import { QResponseMessage, isQResponseMessage } from './websocket.types';

describe('WebSocketメッセージ型のツール拡張', () => {
  describe('TDD Green: QResponseMessage型のツールフィールド拡張', () => {
    test('ツール情報を含むQResponseMessageの型構造', () => {
      const messageWithTools: QResponseMessage = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'ファイルを確認します',
        tools: ['fs_read', 'github_mcp'],
        hasToolContent: true,
      };

      expect(messageWithTools.tools).toEqual(['fs_read', 'github_mcp']);
      expect(messageWithTools.hasToolContent).toBe(true);
      expect(messageWithTools.type).toBe('q_response');
    });

    test('ツール情報なしのQResponseMessageの型構造', () => {
      const messageWithoutTools: QResponseMessage = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: '通常のレスポンス',
      };

      expect(messageWithoutTools.tools).toBeUndefined();
      expect(messageWithoutTools.hasToolContent).toBeUndefined();
      expect(messageWithoutTools.type).toBe('q_response');
    });

    test('空のツールリストを持つQResponseMessage', () => {
      const messageWithEmptyTools: QResponseMessage = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'ツールは使用されていません',
        tools: [],
        hasToolContent: false,
      };

      expect(messageWithEmptyTools.tools).toEqual([]);
      expect(messageWithEmptyTools.hasToolContent).toBe(false);
    });
  });

  describe('TDD Green: isQResponseMessage型ガード関数とツール拡張の互換性', () => {
    test('ツール情報を含むメッセージも正しくQResponseMessageと判定される', () => {
      const messageWithTools: QResponseMessage = {
        type: 'q_response' as const,
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'テストデータ',
        tools: ['fs_read'],
        hasToolContent: true,
      };

      expect(isQResponseMessage(messageWithTools)).toBe(true);
    });

    test('ツール情報なしのメッセージも正しくQResponseMessageと判定される', () => {
      const messageWithoutTools: QResponseMessage = {
        type: 'q_response' as const,
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'テストデータ',
      };

      expect(isQResponseMessage(messageWithoutTools)).toBe(true);
    });
  });

  describe('TDD Green: ツールフィールドの型安全性テスト', () => {
    test('TypeScriptの型チェックによるコンパイル時安全性', () => {
      // このテストはコンパイル時に型エラーが発生しないことを確認する

      const message: QResponseMessage = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'テストデータ',
      };

      // 以下の操作は型安全である
      if (message.tools) {
        const toolCount = message.tools.length;
        expect(toolCount).toBeGreaterThanOrEqual(0);
      }

      if (message.hasToolContent !== undefined) {
        const hasTools = message.hasToolContent;
        expect(typeof hasTools).toBe('boolean');
      }
    });

    test('toolsフィールドは文字列配列として型付けされている', () => {
      const message: QResponseMessage = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'テストデータ',
        tools: ['fs_read', 'github_mcp'],
        hasToolContent: true,
      };

      // tools配列の要素は文字列である
      message.tools?.forEach(tool => {
        expect(typeof tool).toBe('string');
      });
    });
  });
});
