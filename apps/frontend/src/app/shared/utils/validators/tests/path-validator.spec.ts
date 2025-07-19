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
    expect(validatePath('relative/path')).toBe(
      '絶対パスを入力してください（例: /Users/username/project）'
    );
    expect(validatePath('./relative')).toBe(
      '絶対パスを入力してください（例: /Users/username/project）'
    );
  });

  it('危険な文字列を含む場合、エラーメッセージを返す', () => {
    expect(validatePath('/path/../dangerous')).toBe('無効な文字が含まれています');
    expect(validatePath('/path///triple-slash')).toBe('無効な文字が含まれています');
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

  // エッジケースのテスト
  describe('エッジケース', () => {
    it('非常に長いパスを処理する', () => {
      const longPath = '/Users/username/' + 'a'.repeat(1000) + '/project';
      expect(validatePath(longPath)).toBeNull();
    });

    it('Unicode文字を含むパスを処理する', () => {
      expect(validatePath('/Users/ユーザー/プロジェクト')).toBeNull();
      expect(validatePath('/Users/用户/项目')).toBeNull();
      expect(validatePath('/Users/пользователь/проект')).toBeNull();
    });

    it('特殊文字を含むパスを適切に処理する', () => {
      expect(validatePath('/Users/user/project with spaces')).toBeNull();
      expect(validatePath('/Users/user/project-with-dashes')).toBeNull();
      expect(validatePath('/Users/user/project_with_underscores')).toBeNull();
      expect(validatePath('/Users/user/project.with.dots')).toBeNull();
    });

    it('nullやundefinedを渡された場合の動作', () => {
      expect(validatePath(null as unknown as string)).toBe('パスを入力してください');
      expect(validatePath(undefined as unknown as string)).toBe('パスを入力してください');
    });

    it('数値を渡された場合の動作', () => {
      expect(validatePath(123 as unknown as string)).toBe('パスを入力してください');
      expect(validatePath(0 as unknown as string)).toBe('パスを入力してください');
    });

    it('オブジェクトを渡された場合の動作', () => {
      expect(validatePath({} as unknown as string)).toBe('パスを入力してください');
      expect(validatePath([] as unknown as string)).toBe('パスを入力してください');
    });

    it('タブや改行文字を含む入力を処理する', () => {
      expect(validatePath('\t/Users/username/project\n')).toBeNull();
      expect(validatePath('/Users/username/project\r\n')).toBeNull();
    });

    it('ネットワークパス（UNC）を処理する', () => {
      expect(validatePath('\\\\server\\share\\folder')).toBeNull();
      expect(validatePath('//server/share/folder')).toBeNull();
    });

    it('複数の連続するスラッシュやバックスラッシュを検出する', () => {
      expect(validatePath('/path///triple-slash')).toBe('無効な文字が含まれています');
      expect(validatePath('C:\\\\\\path\\\\\\triple-backslash')).toBe('無効な文字が含まれています');
    });

    it('相対パスの様々なパターンを検出する', () => {
      expect(validatePath('../parent')).toBe(
        '絶対パスを入力してください（例: /Users/username/project）'
      );
      expect(validatePath('~/home')).toBe(
        '絶対パスを入力してください（例: /Users/username/project）'
      );
      expect(validatePath('./current')).toBe(
        '絶対パスを入力してください（例: /Users/username/project）'
      );
      expect(validatePath('just-a-name')).toBe(
        '絶対パスを入力してください（例: /Users/username/project）'
      );
    });
  });
});
