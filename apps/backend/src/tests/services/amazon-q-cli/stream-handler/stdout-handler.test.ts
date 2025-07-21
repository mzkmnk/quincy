import { describe, it, expect, beforeEach, vi } from 'vitest';

import { StdoutHandler } from '../../../../services/amazon-q-cli/stream-handler/stdout-handler';
import type { StreamHandlerCallbacks } from '../../../../services/amazon-q-cli/stream-handler/types';

describe('StdoutHandler', () => {
  let handler: StdoutHandler;
  let callbacks: StreamHandlerCallbacks;

  beforeEach(() => {
    callbacks = {
      onThinkingStart: vi.fn(),
      onThinkingUpdate: vi.fn(),
      onThinkingEnd: vi.fn(),
      onChatMessage: vi.fn(),
      onPromptReady: vi.fn(),
      onOutput: vi.fn(),
    };

    handler = new StdoutHandler(callbacks);
  });

  describe('processChunk', () => {
    it('Thinking開始を検知してコールバックを呼ぶ', () => {
      handler.processChunk(Buffer.from('\r⠋ Thinking...'));

      expect(callbacks.onThinkingStart).toHaveBeenCalledWith({
        spinner: '⠋',
        timestamp: expect.any(Number),
      });
      expect(callbacks.onThinkingUpdate).toHaveBeenCalledWith({
        spinner: '⠋',
        timestamp: expect.any(Number),
      });
    });

    it('Thinking中のスピナー更新を検知する', () => {
      handler.processChunk(Buffer.from('\r⠋ Thinking...'));
      handler.processChunk(Buffer.from('\r⠙ Thinking...'));

      expect(callbacks.onThinkingStart).toHaveBeenCalledTimes(1);
      expect(callbacks.onThinkingUpdate).toHaveBeenCalledTimes(2);
      expect(callbacks.onThinkingUpdate).toHaveBeenLastCalledWith({
        spinner: '⠙',
        timestamp: expect.any(Number),
      });
    });

    it('プロンプト表示でThinking終了とチャットメッセージを検知する', () => {
      // まずThinking状態にする
      handler.processChunk(Buffer.from('\r⠋ Thinking...'));

      // プロンプトとメッセージ
      handler.processChunk(Buffer.from('\x1b[38;5;10m>\x1b[0m This is the response'));

      expect(callbacks.onThinkingEnd).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
      });
      expect(callbacks.onChatMessage).toHaveBeenCalledWith({
        content: 'This is the response',
        timestamp: expect.any(Number),
      });
    });

    it('プロンプトのみの場合は入力待機状態を通知する', () => {
      handler.processChunk(Buffer.from('\x1b[38;5;10m>\x1b[0m '));

      expect(callbacks.onPromptReady).toHaveBeenCalledWith({
        timestamp: expect.any(Number),
      });
      expect(callbacks.onChatMessage).not.toHaveBeenCalled();
    });

    it('通常の出力はonOutputコールバックを呼ぶ', () => {
      handler.processChunk(Buffer.from('Regular output text\n'));

      expect(callbacks.onOutput).toHaveBeenCalledWith({
        content: 'Regular output text\n',
        timestamp: expect.any(Number),
      });
    });

    it('複数行を含むチャンクを正しく処理する', () => {
      // まず複数行の通常出力を処理
      handler.processChunk(Buffer.from('Line 1\nLine 2\n'));

      expect(callbacks.onOutput).toHaveBeenCalledWith({
        content: 'Line 1\nLine 2\n',
        timestamp: expect.any(Number),
      });

      // その後プロンプトとレスポンスを処理
      handler.processChunk(Buffer.from('\x1b[38;5;10m>\x1b[0m Response'));

      expect(callbacks.onChatMessage).toHaveBeenCalledWith({
        content: 'Response',
        timestamp: expect.any(Number),
      });
    });
  });

  describe('getState', () => {
    it('現在の状態を取得できる', () => {
      expect(handler.getState()).toBe('idle');

      handler.processChunk(Buffer.from('\r⠋ Thinking...'));
      expect(handler.getState()).toBe('thinking');

      handler.processChunk(Buffer.from('\x1b[38;5;10m>\x1b[0m Response'));
      expect(handler.getState()).toBe('idle');
    });
  });

  describe('reset', () => {
    it('状態をリセットできる', () => {
      handler.processChunk(Buffer.from('\r⠋ Thinking...'));
      expect(handler.getState()).toBe('thinking');

      handler.reset();
      expect(handler.getState()).toBe('idle');

      // リセット後は新たにThinking開始として扱われる
      handler.processChunk(Buffer.from('\r⠋ Thinking...'));
      expect(callbacks.onThinkingStart).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('空のチャンクを処理できる', () => {
      expect(() => {
        handler.processChunk(Buffer.from(''));
      }).not.toThrow();

      expect(callbacks.onOutput).not.toHaveBeenCalled();
    });

    it('不完全なANSIシーケンスを含むチャンクを処理できる', () => {
      handler.processChunk(Buffer.from('\x1b[38;5'));
      handler.processChunk(Buffer.from(';10m>\x1b[0m Test'));

      // 最終的にプロンプトとメッセージが検出される
      expect(callbacks.onChatMessage).toHaveBeenCalledWith({
        content: 'Test',
        timestamp: expect.any(Number),
      });
    });

    it('バッファリングされた内容を正しく処理する', () => {
      // 部分的なThinkingパターン
      handler.processChunk(Buffer.from('\r⠋ Think'));
      handler.processChunk(Buffer.from('ing...'));

      expect(callbacks.onThinkingStart).toHaveBeenCalled();
    });
  });
});
