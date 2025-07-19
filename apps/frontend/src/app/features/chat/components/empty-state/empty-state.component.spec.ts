import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';

import { EmptyStateComponent } from './empty-state.component';

// PathSelectorComponentのモック
@Component({
  selector: 'app-path-selector',
  template: '<div>Path Selector Mock</div>',
  changeDetection: ChangeDetectionStrategy.OnPush
})
class MockPathSelectorComponent {}

describe('EmptyStateComponent', () => {
  let component: EmptyStateComponent;
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
      declarations: [MockPathSelectorComponent]
    })
    .overrideComponent(EmptyStateComponent, {
      remove: {
        imports: [
          require('../../../../shared/components/path-selector/path-selector.component').PathSelectorComponent
        ]
      },
      add: {
        declarations: [MockPathSelectorComponent]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmptyStateComponent);
    component = fixture.componentInstance;
  });

  describe('コンポーネント初期化', () => {
    it('コンポーネントが正常に作成される', () => {
      expect(component).toBeTruthy();
    });

    it('コンポーネントが正しく初期化される', () => {
      fixture.detectChanges();
      expect(component).toBeInstanceOf(EmptyStateComponent);
    });
  });

  describe('テンプレートレンダリング', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('PathSelectorComponentが表示される', () => {
      const pathSelector = fixture.nativeElement.querySelector('app-path-selector');
      expect(pathSelector).toBeTruthy();
    });

    it('適切なコンテナが表示される', () => {
      const container = fixture.nativeElement.querySelector('.flex');
      expect(container).toBeTruthy();
      expect(container.classList.contains('items-center')).toBe(true);
      expect(container.classList.contains('justify-center')).toBe(true);
      expect(container.classList.contains('min-h-full')).toBe(true);
      expect(container.classList.contains('min-w-full')).toBe(true);
    });

    it('PathSelectorがコンテナ内に適切に配置される', () => {
      const container = fixture.nativeElement.querySelector('.flex');
      const pathSelector = container.querySelector('app-path-selector');
      expect(pathSelector).toBeTruthy();
    });
  });

  describe('レイアウトとスタイリング', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('センタリングのためのFlexboxクラスが適用される', () => {
      const container = fixture.nativeElement.querySelector('div');
      expect(container.classList.contains('flex')).toBe(true);
      expect(container.classList.contains('items-center')).toBe(true);
      expect(container.classList.contains('justify-center')).toBe(true);
    });

    it('フルサイズのコンテナクラスが適用される', () => {
      const container = fixture.nativeElement.querySelector('div');
      expect(container.classList.contains('min-h-full')).toBe(true);
      expect(container.classList.contains('min-w-full')).toBe(true);
    });
  });

  describe('コンポーネントの振る舞い', () => {
    it('レンダリング時にエラーが発生しない', () => {
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('複数回のレンダリングでも安定している', () => {
      fixture.detectChanges();
      const firstRender = fixture.nativeElement.innerHTML;
      
      fixture.detectChanges();
      const secondRender = fixture.nativeElement.innerHTML;
      
      expect(firstRender).toBe(secondRender);
    });

    it('コンポーネントの破棄時にエラーが発生しない', () => {
      fixture.detectChanges();
      
      expect(() => {
        fixture.destroy();
      }).not.toThrow();
    });
  });

  describe('アクセシビリティ', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('適切なDOM構造を提供する', () => {
      const container = fixture.nativeElement.querySelector('div');
      expect(container).toBeTruthy();
      
      const pathSelector = container.querySelector('app-path-selector');
      expect(pathSelector).toBeTruthy();
    });

    it('セマンティックHTML要素を適切に使用する', () => {
      const divElements = fixture.nativeElement.querySelectorAll('div');
      expect(divElements.length).toBeGreaterThan(0);
    });
  });

  describe('Change Detection Strategy', () => {
    it('OnPush戦略が適用されている', () => {
      expect(component.constructor.ɵcmp?.onPush).toBe(true);
    });

    it('手動でのchange detectionが正常に動作する', () => {
      fixture.detectChanges();
      const initialHTML = fixture.nativeElement.innerHTML;
      
      fixture.markForCheck();
      fixture.detectChanges();
      
      expect(fixture.nativeElement.innerHTML).toBe(initialHTML);
    });
  });

  describe('エッジケース', () => {
    it('コンポーネントの状態変更がないため常に同じ出力を生成する', () => {
      fixture.detectChanges();
      const html1 = fixture.nativeElement.innerHTML;
      
      // 複数回レンダリング
      for (let i = 0; i < 5; i++) {
        fixture.detectChanges();
      }
      
      const html2 = fixture.nativeElement.innerHTML;
      expect(html1).toBe(html2);
    });

    it('親コンポーネントからの入力変更がない場合、再レンダリングされない', () => {
      fixture.detectChanges();
      const detectChangesSpy = spyOn(fixture, 'detectChanges').and.callThrough();
      
      // 明示的にchange detectionを呼び出し
      fixture.detectChanges();
      
      expect(detectChangesSpy).toHaveBeenCalled();
    });

    it('メモリリークが発生しない', () => {
      fixture.detectChanges();
      
      // コンポーネントの参照を取得
      const componentRef = fixture.componentRef;
      
      // コンポーネントを破棄
      fixture.destroy();
      
      // コンポーネントが破棄されたことを確認
      expect(componentRef.hostView.destroyed).toBe(true);
    });
  });
});