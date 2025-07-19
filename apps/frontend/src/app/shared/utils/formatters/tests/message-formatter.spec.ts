import { formatMessageContent } from '../message-formatter';

describe('formatMessageContent', () => {
  it('空の文字列の場合、空文字を返す', () => {
    expect(formatMessageContent('')).toBe('');
    expect(formatMessageContent(null as unknown as string)).toBe('');
    expect(formatMessageContent(undefined as unknown as string)).toBe('');
  });

  it('前後の空白を削除する', () => {
    expect(formatMessageContent('  Hello  ')).toBe('Hello');
    expect(formatMessageContent('\tWorld\n')).toBe('World');
    expect(formatMessageContent('  \n  Test  \t')).toBe('Test');
  });

  it('最大文字数指定なしの場合、全文を返す', () => {
    const longText = 'This is a very long message that should not be truncated';
    expect(formatMessageContent(longText)).toBe(longText);
  });

  it('最大文字数を超える場合、省略記号を付けて切り詰める', () => {
    const longText = 'This is a very long message';
    expect(formatMessageContent(longText, 10)).toBe('This is a ...');
    expect(formatMessageContent(longText, 15)).toBe('This is a very ...');
  });

  it('最大文字数以内の場合、そのまま返す', () => {
    const shortText = 'Short';
    expect(formatMessageContent(shortText, 10)).toBe('Short');
    expect(formatMessageContent(shortText, 5)).toBe('Short');
  });
});
