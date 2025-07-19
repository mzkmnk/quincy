import { generateId } from '../id-generator';

describe('generateId', () => {
  it('デフォルトプレフィックス "id" でIDを生成する', () => {
    const id = generateId();
    
    expect(id).toContain('id_');
    expect(id.startsWith('id_')).toBe(true);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(3); // 'id_' + タイムスタンプ + '_' + ランダム文字列
  });

  it('指定されたプレフィックスでIDを生成する', () => {
    const prefix = 'test';
    const id = generateId(prefix);
    
    expect(id).toContain(`${prefix}_`);
    expect(id.startsWith(`${prefix}_`)).toBe(true);
    expect(typeof id).toBe('string');
  });

  it('毎回異なるIDを生成する', () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId('same-prefix');
    const id4 = generateId('same-prefix');
    
    expect(id1).not.toBe(id2);
    expect(id3).not.toBe(id4);
  });

  it('一意性を保証する（連続生成でも重複しない）', () => {
    const ids = new Set();
    const iterations = 100;
    
    for (let i = 0; i < iterations; i++) {
      const id = generateId('test');
      expect(ids.has(id)).toBe(false); // 重複がないことを確認
      ids.add(id);
    }
    
    expect(ids.size).toBe(iterations);
  });

  it('プレフィックスに特殊文字を含んでも正しく生成される', () => {
    const prefix = 'msg-123';
    const id = generateId(prefix);
    
    expect(id).toContain(`${prefix}_`);
    expect(id.startsWith(`${prefix}_`)).toBe(true);
  });

  it('空のプレフィックスでも正しく生成される', () => {
    const id = generateId('');
    
    expect(id).toContain('_');
    expect(id.startsWith('_')).toBe(true);
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(1);
  });

  it('IDの構造が期待される形式である', () => {
    const id = generateId('user');
    const parts = id.split('_');
    
    expect(parts).toHaveLength(3); // プレフィックス_タイムスタンプ_ランダム
    expect(parts[0]).toBe('user'); // プレフィックス部分
    expect(parts[1]).not.toBe(''); // タイムスタンプ部分（空でない）
    expect(parts[2]).not.toBe(''); // ランダム部分（空でない）
  });

  it('長いプレフィックスでも正しく処理される', () => {
    const longPrefix = 'very-long-prefix-with-many-characters-123456789';
    const id = generateId(longPrefix);
    
    expect(id).toContain(`${longPrefix}_`);
    expect(id.startsWith(`${longPrefix}_`)).toBe(true);
  });
});