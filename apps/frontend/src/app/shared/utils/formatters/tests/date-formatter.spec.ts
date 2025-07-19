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

  // エッジケースのテスト
  describe('エッジケース', () => {

    it('極端に古い日付を処理する', () => {
      const veryOldDate = new Date('0001-01-01');
      const result = formatDate(veryOldDate, 'short');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('極端に新しい日付を処理する', () => {
      const veryNewDate = new Date('9999-12-31');
      const result = formatDate(veryNewDate, 'short');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('負のタイムスタンプを処理する', () => {
      const negativeTimestamp = -86400000; // 1969-12-31
      const result = formatDate(negativeTimestamp, 'short');
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('ゼロタイムスタンプ（Unix epoch）を処理する', () => {
      const epochTimestamp = 0; // 1970-01-01
      const result = formatDate(epochTimestamp, 'short');
      expect(result).toMatch(/1970/);
    });

    it('非常に大きなタイムスタンプを処理する', () => {
      const largeTimestamp = Number.MAX_SAFE_INTEGER;
      const result = formatDate(largeTimestamp);
      expect(typeof result).toBe('string');
    });

    it('うるう年の日付を正しく処理する', () => {
      const leapYearDate = new Date('2024-02-29T12:00:00');
      const result = formatDate(leapYearDate, 'short');
      expect(result).toMatch(/2024\/02\/29/);
    });

    it('夏時間の境界日付を処理する', () => {
      const dstDate = new Date('2024-03-31T02:30:00'); // 夏時間開始日（例）
      const result = formatDate(dstDate, 'time');
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });

    it('異なるタイムゾーンでの一貫性を保つ', () => {
      const utcDate = new Date('2024-01-15T12:00:00Z');
      const result1 = formatDate(utcDate, 'short');
      const result2 = formatDate(utcDate.getTime(), 'short');
      expect(result1).toBe(result2);
    });


    it('ISO文字列の様々な形式を処理する', () => {
      expect(formatDate('2024-01-15')).toMatch(/2024/);
      expect(formatDate('2024-01-15T10:30:45Z')).toMatch(/2024/);
      expect(formatDate('2024-01-15T10:30:45.123Z')).toMatch(/2024/);
      expect(formatDate('2024-01-15T10:30:45+09:00')).toMatch(/2024/);
    });
  });
});
