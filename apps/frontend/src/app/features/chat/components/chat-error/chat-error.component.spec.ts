import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatErrorComponent } from './chat-error.component';

describe('ChatErrorComponent', () => {
  let component: ChatErrorComponent;
  let fixture: ComponentFixture<ChatErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatErrorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatErrorComponent);
    component = fixture.componentInstance;
  });

  describe('コンポーネント初期化', () => {
    it('コンポーネントが正常に作成される', () => {
      // errorMessageは必須inputなので設定
      fixture.componentRef.setInput('errorMessage', 'Test error message');
      expect(component).toBeTruthy();
    });

    it('errorMessageが必須プロパティとして設定される', () => {
      const testMessage = 'Connection failed error';
      fixture.componentRef.setInput('errorMessage', testMessage);
      fixture.detectChanges();
      
      expect(component.errorMessage()).toBe(testMessage);
    });
  });

  describe('エラーメッセージ表示', () => {
    it('短いエラーメッセージを正しく表示する', () => {
      const errorMessage = 'Simple error';
      fixture.componentRef.setInput('errorMessage', errorMessage);
      fixture.detectChanges();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent.trim()).toContain(errorMessage);
    });

    it('長いエラーメッセージを正しく表示する', () => {
      const longError = 'This is a very long error message that should be displayed correctly in the error component without any truncation issues.';
      fixture.componentRef.setInput('errorMessage', longError);
      fixture.detectChanges();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent.trim()).toContain(longError);
    });

    it('HTML文字を含むエラーメッセージを安全に表示する', () => {
      const htmlError = '<script>alert("xss")</script> Error occurred';
      fixture.componentRef.setInput('errorMessage', htmlError);
      fixture.detectChanges();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent.trim()).toContain(htmlError);
      // HTMLタグがエスケープされていることを確認
      expect(messageElement.innerHTML).not.toContain('<script>');
    });

    it('特殊文字を含むエラーメッセージを正しく表示する', () => {
      const specialCharError = 'Error: 日本語エラー & special chars @#$%';
      fixture.componentRef.setInput('errorMessage', specialCharError);
      fixture.detectChanges();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent.trim()).toContain(specialCharError);
    });

    it('空文字列のエラーメッセージも表示する', () => {
      fixture.componentRef.setInput('errorMessage', '');
      fixture.detectChanges();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement).toBeTruthy();
      expect(messageElement.textContent.trim()).toBe('');
    });
  });

  describe('UI要素の表示', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('errorMessage', 'Test error');
      fixture.detectChanges();
    });

    it('エラーアイコンが表示される', () => {
      const svgElement = fixture.nativeElement.querySelector('svg');
      expect(svgElement).toBeTruthy();
      expect(svgElement.classList.contains('w-24')).toBe(true);
      expect(svgElement.classList.contains('h-24')).toBe(true);
    });

    it('タイトル"Session Start Failed"が表示される', () => {
      const titleElement = fixture.nativeElement.querySelector('h2');
      expect(titleElement).toBeTruthy();
      expect(titleElement.textContent.trim()).toBe('Session Start Failed');
    });

    it('トラブルシューティングのヒントが表示される', () => {
      const hintTitle = fixture.nativeElement.querySelector('.font-medium');
      expect(hintTitle.textContent.trim()).toBe('💡 Troubleshooting Tips:');

      const hints = fixture.nativeElement.querySelectorAll('.text-left p');
      expect(hints.length).toBe(4);
      expect(hints[0].textContent.trim()).toBe('1. Install Amazon Q CLI if not installed');
      expect(hints[1].textContent.trim()).toBe('2. Ensure \'q\' command is in your PATH');
      expect(hints[2].textContent.trim()).toBe('3. Run \'q --version\' in terminal to verify');
      expect(hints[3].textContent.trim()).toBe('4. Restart the application after installation');
    });

    it('"Try Again"ボタンが表示される', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button).toBeTruthy();
      expect(button.textContent.trim()).toBe('Try Again');
    });
  });

  describe('tryAgainイベント', () => {
    it('"Try Again"ボタンクリックでtryAgainイベントが発火される', () => {
      fixture.componentRef.setInput('errorMessage', 'Test error');
      fixture.detectChanges();

      let emittedEvent = false;
      component.tryAgain.subscribe(() => {
        emittedEvent = true;
      });

      const button = fixture.nativeElement.querySelector('button');
      button.click();

      expect(emittedEvent).toBe(true);
    });

    it('複数回のボタンクリックで複数回イベントが発火される', () => {
      fixture.componentRef.setInput('errorMessage', 'Test error');
      fixture.detectChanges();

      let clickCount = 0;
      component.tryAgain.subscribe(() => {
        clickCount++;
      });

      const button = fixture.nativeElement.querySelector('button');
      button.click();
      button.click();
      button.click();

      expect(clickCount).toBe(3);
    });

    it('ボタンが無効化されていてもイベントは発火される', () => {
      fixture.componentRef.setInput('errorMessage', 'Test error');
      fixture.detectChanges();

      let emittedEvent = false;
      component.tryAgain.subscribe(() => {
        emittedEvent = true;
      });

      const button = fixture.nativeElement.querySelector('button');
      button.disabled = true;
      button.click();

      expect(emittedEvent).toBe(true);
    });
  });

  describe('スタイリング', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('errorMessage', 'Test error');
      fixture.detectChanges();
    });

    it('適切なCSSクラスが適用される', () => {
      const container = fixture.nativeElement.querySelector('.h-full');
      expect(container).toBeTruthy();
      expect(container.classList.contains('flex')).toBe(true);
      expect(container.classList.contains('items-center')).toBe(true);
      expect(container.classList.contains('justify-center')).toBe(true);
    });

    it('エラーメッセージエリアに適切なスタイルが適用される', () => {
      const messageArea = fixture.nativeElement.querySelector('p');
      expect(messageArea.classList.contains('leading-relaxed')).toBe(true);
      expect(messageArea.classList.contains('rounded-lg')).toBe(true);
      expect(messageArea.classList.contains('p-4')).toBe(true);
    });

    it('ボタンに適切なスタイルが適用される', () => {
      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('px-4')).toBe(true);
      expect(button.classList.contains('py-2')).toBe(true);
      expect(button.classList.contains('rounded-md')).toBe(true);
      expect(button.classList.contains('font-medium')).toBe(true);
    });
  });

  describe('エッジケース', () => {
    it('非常に長いエラーメッセージでもレイアウトが崩れない', () => {
      const veryLongError = 'Error: '.repeat(100) + 'This is the end of a very long error message.';
      fixture.componentRef.setInput('errorMessage', veryLongError);
      
      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent.trim()).toContain(veryLongError);
    });

    it('改行文字を含むエラーメッセージを処理する', () => {
      const multilineError = 'Line 1\nLine 2\nLine 3';
      fixture.componentRef.setInput('errorMessage', multilineError);
      fixture.detectChanges();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent).toContain(multilineError);
    });

    it('Unicode文字を含むエラーメッセージを処理する', () => {
      const unicodeError = 'エラー: 🚨 接続に失敗しました 🔥';
      fixture.componentRef.setInput('errorMessage', unicodeError);
      fixture.detectChanges();

      const messageElement = fixture.nativeElement.querySelector('p');
      expect(messageElement.textContent.trim()).toContain(unicodeError);
    });
  });
});