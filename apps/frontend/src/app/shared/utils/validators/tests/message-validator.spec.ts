import { isValidMessage } from '../message-validator';

describe('isValidMessage', () => {
  it('空の文字列の場合、falseを返す', () => {
    expect(isValidMessage('')).toBe(false);
    expect(isValidMessage('  ')).toBe(false);
    expect(isValidMessage('\t')).toBe(false);
    expect(isValidMessage('\n')).toBe(false);
  });

  it('有効なメッセージの場合、trueを返す', () => {
    expect(isValidMessage('Hello')).toBe(true);
    expect(isValidMessage('  Hello  ')).toBe(true);
    expect(isValidMessage('こんにちは')).toBe(true);
    expect(isValidMessage('123')).toBe(true);
    expect(isValidMessage('!@#$%')).toBe(true);
  });

  it('複数行のメッセージでも有効', () => {
    expect(isValidMessage('Line 1\nLine 2')).toBe(true);
    expect(isValidMessage('First\n\nThird')).toBe(true);
  });

  // エッジケースのテスト
  describe('エッジケース', () => {
    it('非常に長いメッセージを処理する', () => {
      const longMessage = 'a'.repeat(10000);
      expect(isValidMessage(longMessage)).toBe(true);
    });

    it('Unicode文字（絵文字、記号）を含むメッセージを処理する', () => {
      expect(isValidMessage('Hello 👋 World 🌍')).toBe(true);
      expect(isValidMessage('数学記号: ∑∏∞')).toBe(true);
      expect(isValidMessage('矢印: ←→↑↓')).toBe(true);
      expect(isValidMessage('通貨: €£¥$')).toBe(true);
    });

    it('特殊な空白文字のみの場合、falseを返す', () => {
      expect(isValidMessage('\u00A0')).toBe(false); // Non-breaking space
      expect(isValidMessage('\u2000')).toBe(false); // En quad
      expect(isValidMessage('\u2028')).toBe(false); // Line separator
      expect(isValidMessage('\u2029')).toBe(false); // Paragraph separator
    });

    it('空白文字の組み合わせのみの場合、falseを返す', () => {
      expect(isValidMessage(' \t\n\r ')).toBe(false);
      expect(isValidMessage('\n\n\n')).toBe(false);
      expect(isValidMessage('\t\t\t')).toBe(false);
    });

    it('実際のメッセージに様々な空白文字が含まれている場合、trueを返す', () => {
      expect(isValidMessage(' Hello\tWorld \n')).toBe(true);
      expect(isValidMessage('\n\nActual content\n\n')).toBe(true);
    });
  });
});
