import { formatPath } from '../path-formatter';

describe('formatPath', () => {
  it('空のパスの場合、空文字を返す', () => {
    expect(formatPath('')).toBe('');
    expect(formatPath(null as any)).toBe('');
    expect(formatPath(undefined as any)).toBe('');
  });

  it('オプションなしの場合、そのまま返す', () => {
    expect(formatPath('/Users/test/project')).toBe('/Users/test/project');
    expect(formatPath('C:\\Users\\test\\project')).toBe('C:\\Users\\test\\project');
  });

  it('最大文字数で切り詰める（デフォルト: end）', () => {
    const longPath = '/Users/test/very/long/path/to/project';
    expect(formatPath(longPath, { maxLength: 20 })).toBe('/Users/test/very/...');
  });

  it('最大文字数で切り詰める（start）', () => {
    const longPath = '/Users/test/very/long/path/to/project';
    expect(formatPath(longPath, { maxLength: 20, ellipsisPosition: 'start' })).toBe(
      '...g/path/to/project'
    );
  });

  it('最大文字数で切り詰める（middle）', () => {
    const longPath = '/Users/test/very/long/path/to/project';
    const result = formatPath(longPath, { maxLength: 20, ellipsisPosition: 'middle' });
    expect(result).toContain('...');
    expect(result.length).toBe(19);
    expect(result.startsWith('/Users')).toBe(true);
    expect(result.endsWith('project')).toBe(true);
  });

  it('最大文字数以内の場合、そのまま返す', () => {
    const shortPath = '/Users/test';
    expect(formatPath(shortPath, { maxLength: 20 })).toBe('/Users/test');
  });
});
