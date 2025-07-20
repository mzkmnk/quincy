/**
 * ツール情報対応ストリーミングレスポンス処理のテスト (TDD Red)
 */

import { ToolList } from '../../../../core/types/tool-display.types';

import { handleStreamingResponseWithTools } from './handle-streaming-response-with-tools';

describe('handleStreamingResponseWithTools', () => {
  let onHandleStreamingMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onHandleStreamingMock = vi.fn();
  });

  describe('TDD Red: ツール情報を含むストリーミングレスポンス処理', () => {
    test('ツール情報を含むメッセージを正しく処理する', () => {
      const responseData = {
        sessionId: 'q_session_123',
        data: 'ファイルを確認しました',
        tools: ['fs_read', 'github_mcp'],
        hasToolContent: true,
      };
      const sessionId = 'q_session_123';

      handleStreamingResponseWithTools(responseData, sessionId, onHandleStreamingMock);

      expect(onHandleStreamingMock).toHaveBeenCalledWith(
        'ファイルを確認しました',
        ['fs_read', 'github_mcp'],
        true
      );
    });

    test('ツール情報なしのメッセージを正しく処理する', () => {
      const responseData = {
        sessionId: 'q_session_123',
        data: '通常のレスポンス',
      };
      const sessionId = 'q_session_123';

      handleStreamingResponseWithTools(responseData, sessionId, onHandleStreamingMock);

      expect(onHandleStreamingMock).toHaveBeenCalledWith('通常のレスポンス', undefined, false);
    });

    test('セッションIDが一致しない場合は処理しない', () => {
      const responseData = {
        sessionId: 'q_session_456',
        data: 'メッセージ',
        tools: ['fs_read'],
        hasToolContent: true,
      };
      const sessionId = 'q_session_123';

      handleStreamingResponseWithTools(responseData, sessionId, onHandleStreamingMock);

      expect(onHandleStreamingMock).not.toHaveBeenCalled();
    });

    test('空のツールリストを適切に処理する', () => {
      const responseData = {
        sessionId: 'q_session_123',
        data: 'メッセージ',
        tools: [],
        hasToolContent: false,
      };
      const sessionId = 'q_session_123';

      handleStreamingResponseWithTools(responseData, sessionId, onHandleStreamingMock);

      expect(onHandleStreamingMock).toHaveBeenCalledWith('メッセージ', [], false);
    });

    test('フィールドが部分的に欠けている場合のデフォルト処理', () => {
      const responseData = {
        sessionId: 'q_session_123',
        data: 'メッセージ',
        tools: ['fs_read'],
        // hasToolContent フィールドが欠けている
      };
      const sessionId = 'q_session_123';

      handleStreamingResponseWithTools(responseData, sessionId, onHandleStreamingMock);

      expect(onHandleStreamingMock).toHaveBeenCalledWith(
        'メッセージ',
        ['fs_read'],
        true // ツールがある場合は自動的にtrueと判定
      );
    });
  });

  describe('TDD Red: エラーハンドリングと型安全性', () => {
    test('不正なツールデータの場合はデフォルト値で処理', () => {
      const responseData = {
        sessionId: 'q_session_123',
        data: 'メッセージ',
        tools: 'invalid_data' as unknown as ToolList,
        hasToolContent: 'invalid' as unknown as boolean,
      };
      const sessionId = 'q_session_123';

      handleStreamingResponseWithTools(responseData, sessionId, onHandleStreamingMock);

      expect(onHandleStreamingMock).toHaveBeenCalledWith('メッセージ', undefined, false);
    });

    test('dataフィールドが存在しない場合', () => {
      const responseData = {
        sessionId: 'q_session_123',
        tools: ['fs_read'],
        hasToolContent: true,
      } as { sessionId: string; tools: string[]; hasToolContent: boolean };
      const sessionId = 'q_session_123';

      handleStreamingResponseWithTools(responseData, sessionId, onHandleStreamingMock);

      expect(onHandleStreamingMock).toHaveBeenCalledWith('', ['fs_read'], true);
    });
  });
});
