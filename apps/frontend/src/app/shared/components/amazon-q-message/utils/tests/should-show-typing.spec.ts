import { shouldShowTyping } from '../should-show-typing';

describe('shouldShowTyping', () => {
  describe('基本機能', () => {
    it('isTypingがtrueの場合、trueを返す', () => {
      expect(shouldShowTyping(true)).toBe(true);
    });

    it('isTypingがfalseの場合、falseを返す', () => {
      expect(shouldShowTyping(false)).toBe(false);
    });
  });

  describe('エッジケース', () => {
    it('truthy値を正しく判定する', () => {
      expect(shouldShowTyping(1 as unknown as string)).toBe(1);
      expect(shouldShowTyping('true' as unknown as string)).toBe('true');
      expect(shouldShowTyping({} as unknown as string)).toEqual({});
      expect(shouldShowTyping([] as unknown as string)).toEqual([]);
    });

    it('falsy値を正しく判定する', () => {
      expect(shouldShowTyping(0 as unknown as string)).toBe(0);
      expect(shouldShowTyping('' as unknown as string)).toBe('');
      expect(shouldShowTyping(null as unknown as string)).toBe(null);
      expect(shouldShowTyping(undefined as unknown as string)).toBe(undefined);
      expect(shouldShowTyping(NaN as unknown as string)).toBeNaN();
    });
  });

  describe('型安全性', () => {
    it('boolean値で正常に動作する', () => {
      const typingStates: boolean[] = [true, false];

      typingStates.forEach(state => {
        const result = shouldShowTyping(state);
        expect(typeof result).toBe('boolean');
        expect(result).toBe(state);
      });
    });
  });

  describe('パフォーマンス', () => {
    it('大量呼び出しでも効率的に動作する', () => {
      const start = performance.now();

      for (let i = 0; i < 100000; i++) {
        shouldShowTyping(i % 2 === 0);
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(50); // 50ms以内
    });
  });

  describe('実際の使用シナリオ', () => {
    it('タイピングインディケーター表示の判定', () => {
      // メッセージ入力中
      expect(shouldShowTyping(true)).toBe(true);

      // メッセージ表示中
      expect(shouldShowTyping(false)).toBe(false);
    });

    it('動的な状態変更をシミュレート', () => {
      let isTyping = false;
      expect(shouldShowTyping(isTyping)).toBe(false);

      isTyping = true;
      expect(shouldShowTyping(isTyping)).toBe(true);

      isTyping = false;
      expect(shouldShowTyping(isTyping)).toBe(false);
    });
  });
});
