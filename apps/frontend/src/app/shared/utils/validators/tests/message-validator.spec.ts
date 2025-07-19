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

    it('nullやundefinedを渡された場合の動作', () => {
      expect(isValidMessage(null as unknown as string)).toBe(false);
      expect(isValidMessage(undefined as unknown as string)).toBe(false);
    });

    it('数値を渡された場合の動作', () => {
      expect(isValidMessage(123 as unknown as string)).toBe(false);
      expect(isValidMessage(0 as unknown as string)).toBe(false);
      expect(isValidMessage(NaN as unknown as string)).toBe(false);
    });

    it('オブジェクトを渡された場合の動作', () => {
      expect(isValidMessage({} as unknown as string)).toBe(false);
      expect(isValidMessage([] as unknown as string)).toBe(false);
      expect(isValidMessage({ message: 'hello' } as unknown as string)).toBe(false);
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

    it('コードブロックのようなメッセージを処理する', () => {
      const codeBlock = `
        function hello() {
          console.log("Hello, World!");
        }
      `;
      expect(isValidMessage(codeBlock)).toBe(true);
    });

    it('XMLやHTMLタグのようなメッセージを処理する', () => {
      expect(isValidMessage('<div>Content</div>')).toBe(true);
      expect(isValidMessage('<?xml version="1.0"?>')).toBe(true);
      expect(isValidMessage('<script>alert("test")</script>')).toBe(true);
    });

    it('JSONのようなメッセージを処理する', () => {
      expect(isValidMessage('{"name": "John", "age": 30}')).toBe(true);
      expect(isValidMessage('[1, 2, 3, 4, 5]')).toBe(true);
    });
  });
});
