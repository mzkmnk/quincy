import { describe, test, expect } from 'vitest';

import { ToolDetectionBuffer } from '../../../services/amazon-q-message-parser/tool-detection-buffer';

describe('ToolDetectionBuffer', () => {
  describe('正常系：ストリーミング用のバッファリング', () => {
    test('完全なツールパターンを一度に検出する', () => {
      const buffer = new ToolDetectionBuffer();
      const result = buffer.processChunk('ファイルを確認します🛠️ Using tool: fs_read');

      expect(result.content).toBe('ファイルを確認します');
      expect(result.tools).toEqual(['fs_read']);
      expect(buffer.hasIncompletePattern()).toBe(false);
    });

    test('分割されたツールパターンを正しく蓄積・検出する', () => {
      const buffer = new ToolDetectionBuffer();

      // 第1チャンク：不完全なパターン
      const result1 = buffer.processChunk('開始します🛠️ Using tool: fs_re');
      expect(result1.content).toBe('開始します');
      expect(result1.tools).toEqual([]);
      expect(buffer.hasIncompletePattern()).toBe(true);

      // 第2チャンク：パターン完成
      const result2 = buffer.processChunk('ad完了');
      expect(result2.content).toBe('完了');
      expect(result2.tools).toEqual(['fs_read']);
      expect(buffer.hasIncompletePattern()).toBe(false);
    });

    test('複数チャンクにわたるパターンを処理する', () => {
      const buffer = new ToolDetectionBuffer();

      const result1 = buffer.processChunk('まず🛠️ Using tool:');
      expect(result1.content).toBe('まず');
      expect(result1.tools).toEqual([]);

      const result2 = buffer.processChunk(' fs_readを実行します');
      expect(result2.content).toBe('を実行します');
      expect(result2.tools).toEqual(['fs_read']);
    });

    test('ツールなしのチャンクを正常に処理する', () => {
      const buffer = new ToolDetectionBuffer();
      const result = buffer.processChunk('通常のメッセージです');

      expect(result.content).toBe('通常のメッセージです');
      expect(result.tools).toEqual([]);
      expect(buffer.hasIncompletePattern()).toBe(false);
    });
  });

  describe('正常系：バッファ管理', () => {
    test('clear()でバッファと蓄積ツールをリセットする', () => {
      const buffer = new ToolDetectionBuffer();

      // バッファに不完全パターンを蓄積
      buffer.processChunk('テスト🛠️ Using tool: fs');
      expect(buffer.hasIncompletePattern()).toBe(true);

      // クリア実行
      buffer.clear();
      expect(buffer.hasIncompletePattern()).toBe(false);

      // 新しい処理が正常に動作することを確認
      const result = buffer.processChunk('🛠️ Using tool: github_mcp');
      expect(result.tools).toEqual(['github_mcp']);
    });

    test('getDetectedTools()で蓄積されたツールを取得する', () => {
      const buffer = new ToolDetectionBuffer();

      buffer.processChunk('🛠️ Using tool: fs_read');
      buffer.processChunk('🛠️ Using tool: github_mcp');

      const allTools = buffer.getDetectedTools();
      expect(allTools).toEqual(['fs_read', 'github_mcp']);
    });

    test('getBufferContent()で現在のバッファ内容を取得する', () => {
      const buffer = new ToolDetectionBuffer();

      buffer.processChunk('不完全🛠️ Using tool: fs');

      expect(buffer.getBufferContent()).toBe('🛠️ Using tool: fs');
      expect(buffer.hasIncompletePattern()).toBe(true);
    });
  });

  describe('異常系：エッジケース', () => {
    test('空文字チャンクを安全に処理する', () => {
      const buffer = new ToolDetectionBuffer();
      const result = buffer.processChunk('');

      expect(result.content).toBe('');
      expect(result.tools).toEqual([]);
      expect(buffer.hasIncompletePattern()).toBe(false);
    });

    test('nullやundefinedを安全に処理する', () => {
      const buffer = new ToolDetectionBuffer();

      // @ts-expect-error Testing runtime safety
      const result1 = buffer.processChunk(null);
      expect(result1.content).toBe('');
      expect(result1.tools).toEqual([]);

      // @ts-expect-error Testing runtime safety
      const result2 = buffer.processChunk(undefined);
      expect(result2.content).toBe('');
      expect(result2.tools).toEqual([]);
    });

    test('非常に長い不完全パターンを処理する', () => {
      const buffer = new ToolDetectionBuffer();
      const longIncomplete = '🛠️ Using tool: ' + 'a'.repeat(1000);

      const result = buffer.processChunk(longIncomplete);
      expect(result.content).toBe('');
      expect(result.tools).toEqual([]);
      expect(buffer.hasIncompletePattern()).toBe(true);
    });
  });

  describe('正常系：重複とフィルタリング', () => {
    test('重複するツール名を自動的に除去する', () => {
      const buffer = new ToolDetectionBuffer();

      buffer.processChunk('🛠️ Using tool: fs_read');
      buffer.processChunk('🛠️ Using tool: github_mcp');
      buffer.processChunk('🛠️ Using tool: fs_read');

      const allTools = buffer.getDetectedTools();
      expect(allTools).toEqual(['fs_read', 'github_mcp']);
    });

    test('複数ツールを個別に処理する', () => {
      const buffer = new ToolDetectionBuffer();
      const result1 = buffer.processChunk('🛠️ Using tool: fs_read');
      const result2 = buffer.processChunk('🛠️ Using tool: github_mcp');

      expect(result1.tools).toEqual(['fs_read']);
      expect(result2.tools).toEqual(['github_mcp']);
    });
  });

  describe('正常系：ストリーミングシナリオ', () => {
    test('シンプルなストリーミングパターンを処理', () => {
      const buffer = new ToolDetectionBuffer();

      // シンプルなストリーミング分割パターン
      const result1 = buffer.processChunk('ファイルを確認しています🛠️ Using tool:');
      expect(result1.content).toBe('ファイルを確認しています');
      expect(result1.tools).toEqual([]);

      const result2 = buffer.processChunk(' fs_read完了しました');
      expect(result2.content).toBe('完了しました');
      expect(result2.tools).toEqual(['fs_read']);

      // 最終的なツール一覧を確認
      expect(buffer.getDetectedTools()).toEqual(['fs_read']);
    });
  });
});
