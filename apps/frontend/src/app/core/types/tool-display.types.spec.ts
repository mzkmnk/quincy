/**
 * ツール表示機能の型定義テスト (TDD Red)
 */

import {
  isValidToolName,
  isValidToolList,
  isQResponseMessageWithTools,
  ToolName,
  ToolList,
  QResponseMessageWithTools,
} from './tool-display.types';
import { QResponseMessage } from './websocket.types';

describe('ツール表示機能の型定義', () => {
  describe('TDD Red: ToolName型のテスト', () => {
    test('ToolName型の基本的な型チェック', () => {
      const validToolName: ToolName = 'fs_read';
      expect(typeof validToolName).toBe('string');
    });
  });

  describe('TDD Red: ToolList型のテスト', () => {
    test('ToolList型の基本的な型チェック', () => {
      const validToolList: ToolList = ['fs_read', 'github_mcp'];
      expect(Array.isArray(validToolList)).toBe(true);
    });

    test('空のToolListも有効', () => {
      const emptyToolList: ToolList = [];
      expect(Array.isArray(emptyToolList)).toBe(true);
      expect(emptyToolList.length).toBe(0);
    });
  });

  describe('TDD Red: isValidToolName型ガード関数のテスト', () => {
    test('有効なツール名を正しく判定する', () => {
      expect(isValidToolName('fs_read')).toBe(true);
      expect(isValidToolName('github_mcp')).toBe(true);
      expect(isValidToolName('web_search')).toBe(true);
      expect(isValidToolName('api_call_1')).toBe(true);
    });

    test('無効なツール名を正しく判定する', () => {
      expect(isValidToolName('')).toBe(false);
      expect(isValidToolName(null)).toBe(false);
      expect(isValidToolName(undefined)).toBe(false);
      expect(isValidToolName(123)).toBe(false);
      expect(isValidToolName({})).toBe(false);
      expect(isValidToolName([])).toBe(false);
    });

    test('空白文字のみのツール名は無効', () => {
      expect(isValidToolName(' ')).toBe(false);
      expect(isValidToolName('   ')).toBe(false);
      expect(isValidToolName('\t')).toBe(false);
      expect(isValidToolName('\n')).toBe(false);
    });
  });

  describe('TDD Red: isValidToolList型ガード関数のテスト', () => {
    test('有効なツールリストを正しく判定する', () => {
      expect(isValidToolList([])).toBe(true);
      expect(isValidToolList(['fs_read'])).toBe(true);
      expect(isValidToolList(['fs_read', 'github_mcp'])).toBe(true);
      expect(isValidToolList(['fs_read', 'github_mcp', 'web_search'])).toBe(true);
    });

    test('無効なツールリストを正しく判定する', () => {
      expect(isValidToolList(null)).toBe(false);
      expect(isValidToolList(undefined)).toBe(false);
      expect(isValidToolList('not_array')).toBe(false);
      expect(isValidToolList(123)).toBe(false);
      expect(isValidToolList({})).toBe(false);
    });

    test('無効な要素を含むツールリストは無効', () => {
      expect(isValidToolList([null])).toBe(false);
      expect(isValidToolList([undefined])).toBe(false);
      expect(isValidToolList(['fs_read', null])).toBe(false);
      expect(isValidToolList(['fs_read', ''])).toBe(false);
      expect(isValidToolList(['fs_read', 123])).toBe(false);
    });
  });

  describe('TDD Red: QResponseMessageWithTools型のテスト', () => {
    test('ツール情報を含むQResponseMessage型の基本構造', () => {
      const message: QResponseMessageWithTools = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'ファイルを確認します',
        tools: ['fs_read'],
        hasToolContent: true,
      };

      expect(message.type).toBe('q_response');
      expect(message.tools).toEqual(['fs_read']);
      expect(message.hasToolContent).toBe(true);
    });

    test('ツールなしのQResponseMessage型', () => {
      const message: QResponseMessageWithTools = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: '通常のレスポンス',
        tools: [],
        hasToolContent: false,
      };

      expect(message.tools).toEqual([]);
      expect(message.hasToolContent).toBe(false);
    });
  });

  describe('TDD Red: isQResponseMessageWithTools型ガード関数のテスト', () => {
    test('有効なQResponseMessageWithToolsを正しく判定する', () => {
      const validMessage: QResponseMessage = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'テストデータ',
        tools: ['fs_read'],
        hasToolContent: true,
      };

      expect(isQResponseMessageWithTools(validMessage)).toBe(true);
    });

    test('ツール情報なしのQResponseMessageは無効と判定', () => {
      const messageWithoutTools: QResponseMessage = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'テストデータ',
      };

      expect(isQResponseMessageWithTools(messageWithoutTools)).toBe(false);
    });

    test('異なるメッセージタイプは無効と判定', () => {
      const errorMessage = {
        type: 'q_error',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        error: 'エラーメッセージ',
        tools: ['fs_read'],
        hasToolContent: true,
      };

      expect(isQResponseMessageWithTools(errorMessage)).toBe(false);
    });

    test('無効なツール情報を含むメッセージは無効と判定', () => {
      const invalidToolsMessage = {
        type: 'q_response',
        timestamp: new Date(),
        sessionId: 'q_session_123',
        data: 'テストデータ',
        tools: ['fs_read', null],
        hasToolContent: true,
      };

      expect(isQResponseMessageWithTools(invalidToolsMessage)).toBe(false);
    });

    test('null/undefinedは無効と判定', () => {
      expect(isQResponseMessageWithTools(null)).toBe(false);
      expect(isQResponseMessageWithTools(undefined)).toBe(false);
      expect(isQResponseMessageWithTools({})).toBe(false);
    });
  });
});
