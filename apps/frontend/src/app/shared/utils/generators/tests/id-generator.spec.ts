import { generateId } from '../id-generator';

describe('generateId', () => {
  it('デフォルトプレフィックス "id" でIDを生成する', () => {
    const id = generateId();
    expect(id).toMatch(/^id_\d+_[a-z0-9]+$/);
  });

  it('指定されたプレフィックスでIDを生成する', () => {
    const id = generateId('test');
    expect(id).toMatch(/^test_\d+_[a-z0-9]+$/);
  });

  it('毎回異なるIDを生成する', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('プレフィックスに特殊文字を含んでも正しく生成される', () => {
    const id = generateId('msg-123');
    expect(id).toMatch(/^msg-123_\d+_[a-z0-9]+$/);
  });

  it('空のプレフィックスでも正しく生成される', () => {
    const id = generateId('');
    expect(id).toMatch(/^_\d+_[a-z0-9]+$/);
  });
});