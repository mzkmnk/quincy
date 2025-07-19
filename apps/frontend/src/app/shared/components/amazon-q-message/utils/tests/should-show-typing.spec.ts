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
