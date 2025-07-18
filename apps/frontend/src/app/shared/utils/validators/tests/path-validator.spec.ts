import { validatePath } from '../path-validator';

describe('validatePath', () => {
  it('空の文字列の場合、エラーメッセージを返す', () => {
    expect(validatePath('')).toBe('パスを入力してください');
    expect(validatePath('  ')).toBe('パスを入力してください');
  });

  it('短すぎるパスの場合、エラーメッセージを返す', () => {
    expect(validatePath('/')).toBe('有効なパスを入力してください');
    expect(validatePath('a')).toBe('有効なパスを入力してください');
  });

  it('相対パスの場合、エラーメッセージを返す', () => {
    expect(validatePath('relative/path')).toBe('絶対パスを入力してください（例: /Users/username/project）');
    expect(validatePath('./relative')).toBe('絶対パスを入力してください（例: /Users/username/project）');
  });

  it('危険な文字列を含む場合、エラーメッセージを返す', () => {
    expect(validatePath('/path/../dangerous')).toBe('無効な文字が含まれています');
    expect(validatePath('/path//double-slash')).toBe('無効な文字が含まれています');
  });

  it('有効な絶対パス（Unix/Linux/Mac）の場合、nullを返す', () => {
    expect(validatePath('/Users/username/project')).toBeNull();
    expect(validatePath('/home/user/documents')).toBeNull();
    expect(validatePath('/var/www/html')).toBeNull();
  });

  it('有効な絶対パス（Windows）の場合、nullを返す', () => {
    expect(validatePath('C:\\Users\\username\\project')).toBeNull();
    expect(validatePath('D:\\Documents')).toBeNull();
  });

  it('前後の空白をトリムする', () => {
    expect(validatePath('  /Users/username/project  ')).toBeNull();
    expect(validatePath('  ')).toBe('パスを入力してください');
  });
});