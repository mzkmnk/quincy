import { describe, test, expect } from 'vitest';

import { extractContentAndTools } from '../../../services/amazon-q-message-parser/extract-content-and-tools';

describe('extractContentAndTools', () => {
  describe('正常系：メッセージ本文とツール情報の分離', () => {
    test('通常のメッセージからツール情報を分離する', () => {
      const input =
        'ファイルを確認します。🛠️ Using tool: fs_read\n\nファイルの内容は以下の通りです。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('ファイルを確認します。\n\nファイルの内容は以下の通りです。');
      expect(result.tools).toEqual(['fs_read']);
      expect(result.hasToolContent).toBe(true);
      expect(result.originalMessage).toBe(input);
    });

    test('複数のツールを含むメッセージを処理する', () => {
      const input =
        '🛠️ Using tool: fs_read🛠️ Using tool: github_mcpコードを確認して修正を提案します。\n結果をお伝えします。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('コードを確認して修正を提案します。\n結果をお伝えします。');
      expect(result.tools).toEqual(['fs_read', 'github_mcp']);
      expect(result.hasToolContent).toBe(true);
    });

    test('複数のツール行が散在するメッセージを処理する', () => {
      const input =
        'まず🛠️ Using tool: fs_read ファイルを読み込みます。\n次に🛠️ Using tool: github_mcp GitHubの情報を確認します。\n完了しました。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe(
        'まず ファイルを読み込みます。\n次に GitHubの情報を確認します。\n完了しました。'
      );
      expect(result.tools).toEqual(['fs_read', 'github_mcp']);
      expect(result.hasToolContent).toBe(true);
    });

    test('ツール情報がないメッセージはそのまま返す', () => {
      const input = '通常のAIの回答です。\n改行も含まれています。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe(input);
      expect(result.tools).toEqual([]);
      expect(result.hasToolContent).toBe(false);
      expect(result.originalMessage).toBe(input);
    });

    test('空のメッセージを処理する', () => {
      const input = '';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('');
      expect(result.tools).toEqual([]);
      expect(result.hasToolContent).toBe(false);
    });
  });

  describe('正常系：改行とフォーマットの処理', () => {
    test('ツール行削除後の余分な改行を適切に処理する', () => {
      const input = 'はじめに確認します。\n🛠️ Using tool: fs_read\n\n\n結果です。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('はじめに確認します。\n\n結果です。');
      expect(result.tools).toEqual(['fs_read']);
    });

    test('行の先頭や末尾にあるツール情報を正しく除去する', () => {
      const input =
        '🛠️ Using tool: fs_read\nファイルの内容:\nHello World\n🛠️ Using tool: github_mcp';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('ファイルの内容:\nHello World');
      expect(result.tools).toEqual(['fs_read', 'github_mcp']);
    });

    test('連続するツール行を正しく処理する', () => {
      const input = '🛠️ Using tool: fs_read🛠️ Using tool: github_mcp\n結果をお知らせします。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('結果をお知らせします。');
      expect(result.tools).toEqual(['fs_read', 'github_mcp']);
    });
  });

  describe('異常系：エッジケース', () => {
    test('nullやundefinedを安全に処理する', () => {
      // @ts-expect-error Testing runtime safety
      const result1 = extractContentAndTools(null);
      expect(result1.content).toBe('');
      expect(result1.tools).toEqual([]);
      expect(result1.hasToolContent).toBe(false);

      // @ts-expect-error Testing runtime safety
      const result2 = extractContentAndTools(undefined);
      expect(result2.content).toBe('');
      expect(result2.tools).toEqual([]);
      expect(result2.hasToolContent).toBe(false);
    });

    test('非文字列型を安全に処理する', () => {
      // @ts-expect-error Testing runtime safety
      const result = extractContentAndTools(123);
      expect(result.content).toBe('');
      expect(result.tools).toEqual([]);
      expect(result.hasToolContent).toBe(false);
    });

    test('重複するツール名を除去する', () => {
      const input =
        '🛠️ Using tool: fs_read🛠️ Using tool: fs_read🛠️ Using tool: github_mcp🛠️ Using tool: fs_readテストです。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('テストです。');
      expect(result.tools).toEqual(['fs_read', 'github_mcp']); // 重複除去
    });
  });

  describe('正常系：特殊なフォーマット', () => {
    test('ツール名にスペースや特殊文字が含まれる場合', () => {
      const input =
        '🛠️ Using tool: fs_read_v2🛠️ Using tool: web-search🛠️ Using tool: api_call_1処理中です。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('処理中です。');
      expect(result.tools).toEqual(['fs_read_v2', 'web-search', 'api_call_1']);
    });

    test('マルチバイト文字を含むメッセージを正しく処理する', () => {
      const input = 'こんにちは🛠️ Using tool: fs_readファイルを確認しました。日本語のテストです。';
      const result = extractContentAndTools(input);

      expect(result.content).toBe('こんにちはファイルを確認しました。日本語のテストです。');
      expect(result.tools).toEqual(['fs_read']);
    });
  });
});
