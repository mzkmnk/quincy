import { describe, it, expect, beforeEach } from 'vitest';

import { ChatMessageExtractor } from '../../../../services/amazon-q-cli/realtime-chat/chat-message-extractor';

describe('ChatMessageExtractor', () => {
  let extractor: ChatMessageExtractor;

  beforeEach(() => {
    extractor = new ChatMessageExtractor();
  });

  describe('extractMessage', () => {
    it('プロンプト後のメッセージを抽出できる', () => {
      const input = '\x1b[38;5;10m>\x1b[0m This is a response from Amazon Q';
      const result = extractor.extractMessage(input);

      expect(result).toEqual({
        hasMessage: true,
        message: 'This is a response from Amazon Q',
        isComplete: true,
      });
    });

    it('プロンプトのみの場合はメッセージなしと判定する', () => {
      const input = '\x1b[38;5;10m>\x1b[0m ';
      const result = extractor.extractMessage(input);

      expect(result).toEqual({
        hasMessage: false,
        message: '',
        isComplete: false,
      });
    });

    it('プロンプトがない場合は通常の出力として扱う', () => {
      const input = 'Regular output without prompt';
      const result = extractor.extractMessage(input);

      expect(result).toEqual({
        hasMessage: true,
        message: 'Regular output without prompt',
        isComplete: false,
      });
    });

    it('複数行のメッセージを処理できる', () => {
      const input = '\x1b[38;5;10m>\x1b[0m Line 1\nLine 2\nLine 3';
      const result = extractor.extractMessage(input);

      expect(result).toEqual({
        hasMessage: true,
        message: 'Line 1\nLine 2\nLine 3',
        isComplete: true,
      });
    });
  });

  describe('accumulateMessage', () => {
    it('複数のチャンクからメッセージを蓄積できる', () => {
      extractor.accumulateMessage('Part 1 ');
      extractor.accumulateMessage('Part 2 ');
      extractor.accumulateMessage('Part 3');

      const result = extractor.getAccumulatedMessage();

      expect(result).toBe('Part 1 Part 2 Part 3');
    });

    it('プロンプトで蓄積が完了する', () => {
      extractor.accumulateMessage('Message part ');
      const extracted = extractor.extractMessage('\x1b[38;5;10m>\x1b[0m Final part');

      expect(extracted.message).toBe('Final part');
      expect(extracted.isComplete).toBe(true);
    });
  });

  describe('reset', () => {
    it('蓄積されたメッセージをリセットできる', () => {
      extractor.accumulateMessage('Some content');
      expect(extractor.getAccumulatedMessage()).toBe('Some content');

      extractor.reset();
      expect(extractor.getAccumulatedMessage()).toBe('');
    });
  });

  describe('trimMessage', () => {
    it('メッセージの前後の空白を除去する', () => {
      const input = '\x1b[38;5;10m>\x1b[0m   Trimmed message   ';
      const result = extractor.extractMessage(input);

      expect(result.message).toBe('Trimmed message');
    });

    it('改行は保持する', () => {
      const input = '\x1b[38;5;10m>\x1b[0m Message\nwith\nnewlines';
      const result = extractor.extractMessage(input);

      expect(result.message).toBe('Message\nwith\nnewlines');
    });
  });

  describe('isValidMessage', () => {
    it('有効なメッセージを判定できる', () => {
      expect(extractor.isValidMessage('Valid message')).toBe(true);
      expect(extractor.isValidMessage('')).toBe(false);
      expect(extractor.isValidMessage('   ')).toBe(false);
      expect(extractor.isValidMessage('\n\n')).toBe(false);
    });
  });
});
