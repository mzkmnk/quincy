/**
 * チャットWebSocketツール統合のテスト (TDD Red)
 */

import type { ToolList } from '../../core/types/tool-display.types';

import { ChatWebSocketHandlers } from './services/chat-websocket';
import { handleStreamingResponseWithTools } from './services/chat-websocket/handle-streaming-response-with-tools';

describe('チャットWebSocketツール統合', () => {
  let mockHandleStreamingResponse: ReturnType<typeof vi.fn>;
  let mockCurrentSession: { sessionId: string };

  beforeEach(() => {
    mockHandleStreamingResponse = vi.fn();
    mockCurrentSession = { sessionId: 'q_session_123' };
  });

  describe('TDD Red: WebSocketハンドラーのツール対応統合', () => {
    test('ツール情報付きレスポンスを適切に処理する', () => {
      const responseData = {
        sessionId: 'q_session_123',
        data: 'ファイルを確認しました',
        tools: ['fs_read', 'github_mcp'] as ToolList,
        hasToolContent: true,
      };

      // 新しいハンドラー構造のテスト
      const handlers: ChatWebSocketHandlers = {
        onQResponse: data => {
          handleStreamingResponseWithTools(
            data,
            mockCurrentSession.sessionId,
            (content, tools, hasToolContent) => {
              mockHandleStreamingResponse(content, tools, hasToolContent);
            }
          );
        },
        onError: vi.fn(),
        onInfo: vi.fn(),
        onCompletion: vi.fn(),
      };

      handlers.onQResponse(responseData);

      expect(mockHandleStreamingResponse).toHaveBeenCalledWith(
        'ファイルを確認しました',
        ['fs_read', 'github_mcp'],
        true
      );
    });

    test('ツール情報なしレスポンスを適切に処理する', () => {
      const responseData = {
        sessionId: 'q_session_123',
        data: '通常のレスポンス',
      };

      const handlers: ChatWebSocketHandlers = {
        onQResponse: data => {
          handleStreamingResponseWithTools(
            data,
            mockCurrentSession.sessionId,
            (content, tools, hasToolContent) => {
              mockHandleStreamingResponse(content, tools, hasToolContent);
            }
          );
        },
        onError: vi.fn(),
        onInfo: vi.fn(),
        onCompletion: vi.fn(),
      };

      handlers.onQResponse(responseData);

      expect(mockHandleStreamingResponse).toHaveBeenCalledWith(
        '通常のレスポンス',
        undefined,
        false
      );
    });

    test('別セッションのレスポンスは処理しない', () => {
      const responseData = {
        sessionId: 'q_session_456',
        data: 'メッセージ',
        tools: ['fs_read'] as ToolList,
        hasToolContent: true,
      };

      const handlers: ChatWebSocketHandlers = {
        onQResponse: data => {
          handleStreamingResponseWithTools(
            data,
            mockCurrentSession.sessionId,
            (content, tools, hasToolContent) => {
              mockHandleStreamingResponse(content, tools, hasToolContent);
            }
          );
        },
        onError: vi.fn(),
        onInfo: vi.fn(),
        onCompletion: vi.fn(),
      };

      handlers.onQResponse(responseData);

      expect(mockHandleStreamingResponse).not.toHaveBeenCalled();
    });
  });

  describe('TDD Red: ストリーミング更新の統合', () => {
    test('ツール情報を含むストリーミング処理パラメータ検証', () => {
      // ストリーミング処理関数のシグネチャテスト
      const testHandleStreamingResponse = (
        content: string,
        tools?: ToolList,
        hasToolContent?: boolean
      ): void => {
        // パラメータの型と値を検証
        expect(typeof content).toBe('string');
        if (tools !== undefined) {
          expect(Array.isArray(tools)).toBe(true);
        }
        if (hasToolContent !== undefined) {
          expect(typeof hasToolContent).toBe('boolean');
        }
      };

      // 各種パターンでのパラメータ検証
      testHandleStreamingResponse('コンテンツ');
      testHandleStreamingResponse('コンテンツ', ['fs_read'], true);
      testHandleStreamingResponse('コンテンツ', [], false);
      testHandleStreamingResponse('コンテンツ', undefined, false);
    });
  });
});
