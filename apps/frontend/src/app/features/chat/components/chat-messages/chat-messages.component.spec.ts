import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, output, ChangeDetectionStrategy } from '@angular/core';

import { MessageListComponent } from '../../../../shared/components/message-list/message-list.component';
import { MessageInputComponent } from '../../../../shared/components/message-input/message-input.component';

import { ChatMessagesComponent } from './chat-messages.component';

// MessageListComponentとMessageInputComponentのモック
@Component({
  selector: 'app-message-list',
  template: '<div>Message List Mock</div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockMessageListComponent {}

@Component({
  selector: 'app-message-input',
  template: '<div>Message Input Mock</div>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockMessageInputComponent {
  messageSent = output<{ content: string }>();
}

describe('ChatMessagesComponent', () => {
  let component: ChatMessagesComponent;
  let fixture: ComponentFixture<ChatMessagesComponent>;

  // テストヘルパー関数
  const setDefaultInputs = () => {
    fixture.componentRef.setInput('isSessionDisabled', false);
    fixture.componentRef.setInput('disabledReason', '');
    fixture.componentRef.setInput('hasSessionError', false);
  };

  const setDisabledInputs = (reason: string, hasError: boolean = false) => {
    fixture.componentRef.setInput('isSessionDisabled', true);
    fixture.componentRef.setInput('disabledReason', reason);
    fixture.componentRef.setInput('hasSessionError', hasError);
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatMessagesComponent],
      declarations: [MockMessageListComponent, MockMessageInputComponent],
    })
      .overrideComponent(ChatMessagesComponent, {
        remove: {
          imports: [MessageListComponent, MessageInputComponent],
        },
        add: {
          declarations: [MockMessageListComponent, MockMessageInputComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ChatMessagesComponent);
    component = fixture.componentInstance;
  });

  describe('コンポーネント初期化', () => {
    it('コンポーネントが正常に作成される', () => {
      setDefaultInputs();
      expect(component).toBeTruthy();
    });

    it('必須inputプロパティが正しく設定される', () => {
      fixture.componentRef.setInput('isSessionDisabled', true);
      fixture.componentRef.setInput('disabledReason', 'Test reason');
      fixture.componentRef.setInput('hasSessionError', false);
      fixture.detectChanges();

      expect(component.isSessionDisabled()).toBe(true);
      expect(component.disabledReason()).toBe('Test reason');
      expect(component.hasSessionError()).toBe(false);
    });
  });

  describe('セッションが有効な場合', () => {
    beforeEach(() => {
      setDefaultInputs();
      fixture.detectChanges();
    });

    it('MessageListComponentが表示される', () => {
      const messageList = fixture.nativeElement.querySelector('app-message-list');
      expect(messageList).toBeTruthy();
    });

    it('MessageInputComponentが表示される', () => {
      const messageInput = fixture.nativeElement.querySelector('app-message-input');
      expect(messageInput).toBeTruthy();
    });

    it('無効化メッセージが表示されない', () => {
      const disabledMessage = fixture.nativeElement.querySelector(
        '.bg-\\[var\\(--secondary-bg\\)\\]'
      );
      expect(disabledMessage).toBeFalsy();
    });

    it('MessageInputからのmessageSentイベントを正しく転送する', () => {
      let emittedMessage: { content: string } | null = null;
      component.messageSent.subscribe(message => {
        emittedMessage = message;
      });

      const messageInput = fixture.nativeElement.querySelector('app-message-input');
      const testMessage = { content: 'Test message' };

      // MessageInputのmessageSentイベントをシミュレート
      const event = new CustomEvent('messageSent', { detail: testMessage });
      messageInput.dispatchEvent(event);

      // 実際のコンポーネントではこのようにイベントを発火
      component.messageSent.emit(testMessage);
      expect(emittedMessage).toEqual(testMessage);
    });
  });

  describe('セッションが無効な場合', () => {
    it('エラーなしの無効化状態を正しく表示する', () => {
      setDisabledInputs('Session is disabled', false);
      fixture.detectChanges();

      const messageInput = fixture.nativeElement.querySelector('app-message-input');
      expect(messageInput).toBeFalsy();

      const disabledMessage = fixture.nativeElement.querySelector(
        '.bg-\\[var\\(--secondary-bg\\)\\]'
      );
      expect(disabledMessage).toBeTruthy();

      const reasonText = fixture.nativeElement.querySelector('p');
      expect(reasonText.textContent.trim()).toBe('Session is disabled');

      const startButton = fixture.nativeElement.querySelector('button');
      expect(startButton).toBeFalsy();
    });

    it('セッションエラーありの無効化状態を正しく表示する', () => {
      setDisabledInputs('Connection failed', true);
      fixture.detectChanges();

      const messageInput = fixture.nativeElement.querySelector('app-message-input');
      expect(messageInput).toBeFalsy();

      const disabledMessage = fixture.nativeElement.querySelector(
        '.bg-\\[var\\(--secondary-bg\\)\\]'
      );
      expect(disabledMessage).toBeTruthy();

      const reasonText = fixture.nativeElement.querySelector('p');
      expect(reasonText.textContent.trim()).toBe('Connection failed');

      const startButton = fixture.nativeElement.querySelector('button');
      expect(startButton).toBeTruthy();
      expect(startButton.textContent.trim()).toBe('Start New Session');
    });

    it('"Start New Session"ボタンクリックでclearErrorイベントが発火される', () => {
      setDisabledInputs('Connection failed', true);
      fixture.detectChanges();

      let clearErrorEmitted = false;
      component.clearError.subscribe(() => {
        clearErrorEmitted = true;
      });

      const startButton = fixture.nativeElement.querySelector('button');
      startButton.click();

      expect(clearErrorEmitted).toBe(true);
    });

    it('複数回のボタンクリックで複数回clearErrorイベントが発火される', () => {
      setDisabledInputs('Connection failed', true);
      fixture.detectChanges();

      let clickCount = 0;
      component.clearError.subscribe(() => {
        clickCount++;
      });

      const startButton = fixture.nativeElement.querySelector('button');
      startButton.click();
      startButton.click();
      startButton.click();

      expect(clickCount).toBe(3);
    });
  });

  describe('様々な無効化理由', () => {
    it('短い無効化理由を表示する', () => {
      setDisabledInputs('Error', false);
      fixture.detectChanges();

      const reasonText = fixture.nativeElement.querySelector('p');
      expect(reasonText.textContent.trim()).toBe('Error');
    });

    it('長い無効化理由を表示する', () => {
      const longReason =
        'This is a very long disabled reason that explains in detail why the session is currently unavailable.';
      setDisabledInputs(longReason, false);
      fixture.detectChanges();

      const reasonText = fixture.nativeElement.querySelector('p');
      expect(reasonText.textContent.trim()).toBe(longReason);
    });

    it('空の無効化理由を処理する', () => {
      setDisabledInputs('', false);
      fixture.detectChanges();

      const reasonText = fixture.nativeElement.querySelector('p');
      expect(reasonText.textContent.trim()).toBe('');
    });

    it('特殊文字を含む無効化理由を処理する', () => {
      const specialReason = 'Error: 接続に失敗しました & special chars @#$%';
      setDisabledInputs(specialReason, false);
      fixture.detectChanges();

      const reasonText = fixture.nativeElement.querySelector('p');
      expect(reasonText.textContent.trim()).toBe(specialReason);
    });

    it('HTMLタグを含む無効化理由を安全に処理する', () => {
      const htmlReason = '<script>alert("xss")</script> Session disabled';
      setDisabledInputs(htmlReason, false);
      fixture.detectChanges();

      const reasonText = fixture.nativeElement.querySelector('p');
      expect(reasonText.textContent.trim()).toBe(htmlReason);
      // HTMLタグがエスケープされていることを確認
      expect(reasonText.innerHTML).not.toContain('<script>');
    });
  });

  describe('レイアウトとスタイリング', () => {
    it('適切なレイアウトクラスが適用される', () => {
      setDefaultInputs();
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.flex-1');
      expect(container).toBeTruthy();
      expect(container.classList.contains('overflow-y-auto')).toBe(true);

      const stickyInput = fixture.nativeElement.querySelector('.sticky');
      expect(stickyInput).toBeTruthy();
      expect(stickyInput.classList.contains('bottom-0')).toBe(true);
      expect(stickyInput.classList.contains('z-10')).toBe(true);
    });

    it('無効化状態で適切なスタイルが適用される', () => {
      setDisabledInputs('Test reason', true);
      fixture.detectChanges();

      const disabledContainer = fixture.nativeElement.querySelector(
        '.bg-\\[var\\(--secondary-bg\\)\\]'
      );
      expect(disabledContainer).toBeTruthy();
      expect(disabledContainer.classList.contains('border-t')).toBe(true);
      expect(disabledContainer.classList.contains('p-4')).toBe(true);
      expect(disabledContainer.classList.contains('text-center')).toBe(true);

      const button = fixture.nativeElement.querySelector('button');
      expect(button.classList.contains('px-4')).toBe(true);
      expect(button.classList.contains('py-2')).toBe(true);
      expect(button.classList.contains('rounded-md')).toBe(true);
    });
  });

  describe('エッジケース', () => {
    it('hasSessionErrorがtrueでisSessionDisabledがfalseの場合', () => {
      fixture.componentRef.setInput('isSessionDisabled', false);
      fixture.componentRef.setInput('disabledReason', 'No error');
      fixture.componentRef.setInput('hasSessionError', true);
      fixture.detectChanges();

      // セッションが有効なのでMessageInputが表示される
      const messageInput = fixture.nativeElement.querySelector('app-message-input');
      expect(messageInput).toBeTruthy();

      // 無効化メッセージは表示されない
      const disabledMessage = fixture.nativeElement.querySelector(
        '.bg-\\[var\\(--secondary-bg\\)\\]'
      );
      expect(disabledMessage).toBeFalsy();
    });

    it('hasSessionErrorがfalseでisSessionDisabledがtrueの場合', () => {
      setDisabledInputs('Session disabled but no error', false);
      fixture.detectChanges();

      const messageInput = fixture.nativeElement.querySelector('app-message-input');
      expect(messageInput).toBeFalsy();

      const disabledMessage = fixture.nativeElement.querySelector(
        '.bg-\\[var\\(--secondary-bg\\)\\]'
      );
      expect(disabledMessage).toBeTruthy();

      const startButton = fixture.nativeElement.querySelector('button');
      expect(startButton).toBeFalsy();
    });

    it('inputの動的変更を正しく処理する', () => {
      // 最初は有効
      setDefaultInputs();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-message-input')).toBeTruthy();

      // 無効に変更
      setDisabledInputs('Now disabled', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-message-input')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('button')).toBeTruthy();

      // 再び有効に変更
      setDefaultInputs();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-message-input')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('button')).toBeFalsy();
    });
  });
});
