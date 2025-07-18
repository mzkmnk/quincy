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
});