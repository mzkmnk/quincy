import { ElementRef } from '@angular/core';

import { scrollToBottom } from '../scroll-to-bottom';

describe('scrollToBottom', () => {
  let mockElement: any;
  let mockElementRef: ElementRef<HTMLDivElement>;

  beforeEach(() => {
    mockElement = {
      scrollTop: 0,
      scrollHeight: 1000,
    };

    mockElementRef = {
      nativeElement: mockElement,
    } as ElementRef<HTMLDivElement>;
  });

  describe('基本機能', () => {
    it('正常にスクロールを最下部に移動する', () => {
      scrollToBottom(mockElementRef);

      expect(mockElement.scrollTop).toBe(mockElement.scrollHeight);
    });

    it('scrollHeightが変更されても正しく最下部にスクロールする', () => {
      mockElement.scrollHeight = 2000;

      scrollToBottom(mockElementRef);

      expect(mockElement.scrollTop).toBe(2000);
    });
  });

  describe('エラーハンドリング', () => {
    it('ElementRefがnullの場合でもエラーを発生させない', () => {
      expect(() => scrollToBottom(null as any)).not.toThrow();
    });

    it('ElementRefがundefinedの場合でもエラーを発生させない', () => {
      expect(() => scrollToBottom(undefined as any)).not.toThrow();
    });

    it('nativeElementがnullの場合でもエラーを発生させない', () => {
      const nullElementRef = { nativeElement: null } as any;

      expect(() => scrollToBottom(nullElementRef)).not.toThrow();
    });

    it('scrollTopへの代入がエラーを発生させる場合でもクラッシュしない', () => {
      Object.defineProperty(mockElement, 'scrollTop', {
        set: () => {
          throw new Error('Scroll error');
        },
      });

      expect(() => scrollToBottom(mockElementRef)).not.toThrow();
    });

    it('scrollHeightへのアクセスがエラーを発生させる場合でもクラッシュしない', () => {
      Object.defineProperty(mockElement, 'scrollHeight', {
        get: () => {
          throw new Error('ScrollHeight error');
        },
      });

      expect(() => scrollToBottom(mockElementRef)).not.toThrow();
    });
  });

  describe('異なるスクロール状態', () => {
    it('すでに最下部にある場合でも正常に動作する', () => {
      mockElement.scrollTop = mockElement.scrollHeight;

      scrollToBottom(mockElementRef);

      expect(mockElement.scrollTop).toBe(mockElement.scrollHeight);
    });

    it('スクロール位置が途中の場合、最下部に移動する', () => {
      mockElement.scrollTop = 500;
      mockElement.scrollHeight = 1000;

      scrollToBottom(mockElementRef);

      expect(mockElement.scrollTop).toBe(1000);
    });

    it('scrollHeightが0の場合でも正常に動作する', () => {
      mockElement.scrollHeight = 0;

      scrollToBottom(mockElementRef);

      expect(mockElement.scrollTop).toBe(0);
    });
  });

  describe('DOM要素の状態変化', () => {
    it('要素が動的に高さを変更した場合の処理', () => {
      scrollToBottom(mockElementRef);
      expect(mockElement.scrollTop).toBe(1000);

      // 高さを変更
      mockElement.scrollHeight = 1500;
      scrollToBottom(mockElementRef);
      expect(mockElement.scrollTop).toBe(1500);
    });

    it('複数回連続でスクロールを呼び出しても正常に動作する', () => {
      for (let i = 0; i < 10; i++) {
        mockElement.scrollHeight = (i + 1) * 100;
        scrollToBottom(mockElementRef);
        expect(mockElement.scrollTop).toBe((i + 1) * 100);
      }
    });
  });

  describe('パフォーマンス', () => {
    it('大量の連続呼び出しでも効率的に動作する', () => {
      const start = performance.now();

      for (let i = 0; i < 1000; i++) {
        scrollToBottom(mockElementRef);
      }

      const end = performance.now();
      expect(end - start).toBeLessThan(50); // 50ms以内
    });
  });

  describe('実際のDOM要素との統合', () => {
    it('実際のDIV要素でスクロールが動作する', () => {
      // JSDOM環境での実際のDOM要素テスト
      const div = document.createElement('div');
      div.style.height = '100px';
      div.style.overflow = 'auto';
      div.innerHTML = '<div style="height: 500px;">Long content</div>';
      document.body.appendChild(div);

      const realElementRef = { nativeElement: div } as ElementRef<HTMLDivElement>;

      scrollToBottom(realElementRef);

      // スクロールが最下部に移動したことを確認
      expect(div.scrollTop).toBeGreaterThan(0);
      expect(div.scrollTop).toBe(div.scrollHeight - div.clientHeight);

      document.body.removeChild(div);
    });
  });
});
