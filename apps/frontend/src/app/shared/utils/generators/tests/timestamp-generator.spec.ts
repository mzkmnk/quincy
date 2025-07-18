import { generateTimestamp, generateCurrentDate } from '../timestamp-generator';

describe('generateTimestamp', () => {
  it('現在のタイムスタンプを生成する', () => {
    const before = Date.now();
    const timestamp = generateTimestamp();
    const after = Date.now();

    expect(timestamp).toBeGreaterThanOrEqual(before);
    expect(timestamp).toBeLessThanOrEqual(after);
    expect(typeof timestamp).toBe('number');
  });

  it('毎回異なるタイムスタンプを生成する', () => {
    const timestamp1 = generateTimestamp();
    // 少し待つ
    const timestamp2 = generateTimestamp();
    expect(timestamp2).toBeGreaterThanOrEqual(timestamp1);
  });
});

describe('generateCurrentDate', () => {
  it('現在の日時を生成する', () => {
    const before = new Date();
    const date = generateCurrentDate();
    const after = new Date();

    expect(date).toBeInstanceOf(Date);
    expect(date.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(date.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('毎回異なる日時を生成する', () => {
    const date1 = generateCurrentDate();
    const date2 = generateCurrentDate();
    expect(date2.getTime()).toBeGreaterThanOrEqual(date1.getTime());
  });
});