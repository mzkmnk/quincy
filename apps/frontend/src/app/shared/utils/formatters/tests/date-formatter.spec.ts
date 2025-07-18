import { formatDate } from '../date-formatter';

describe('formatDate', () => {
  const testDate = new Date('2024-01-15T13:30:45');
  const timestamp = testDate.getTime();
  const dateString = '2024-01-15T13:30:45';

  it('Dateオブジェクトをshort形式でフォーマットする', () => {
    const result = formatDate(testDate, 'short');
    expect(result).toMatch(/2024\/01\/15/);
  });

  it('タイムスタンプをshort形式でフォーマットする', () => {
    const result = formatDate(timestamp, 'short');
    expect(result).toMatch(/2024\/01\/15/);
  });

  it('文字列をshort形式でフォーマットする', () => {
    const result = formatDate(dateString, 'short');
    expect(result).toMatch(/2024\/01\/15/);
  });

  it('long形式でフォーマットする', () => {
    const result = formatDate(testDate, 'long');
    expect(result).toContain('2024年');
    expect(result).toContain('1月');
    expect(result).toContain('15日');
  });

  it('time形式でフォーマットする', () => {
    const result = formatDate(testDate, 'time');
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('無効な日付の場合、空文字を返す', () => {
    expect(formatDate('invalid date')).toBe('');
    expect(formatDate(NaN)).toBe('');
    expect(formatDate(new Date('invalid'))).toBe('');
  });

  it('デフォルトはshort形式', () => {
    const result = formatDate(testDate);
    expect(result).toMatch(/2024\/01\/15/);
  });
});