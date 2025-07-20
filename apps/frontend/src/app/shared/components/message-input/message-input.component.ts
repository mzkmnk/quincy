import {
  Component,
  signal,
  ViewChild,
  ElementRef,
  inject,
  ChangeDetectionStrategy,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';

import { WebSocketService } from '../../../core/services/websocket.service';
import { AppStore } from '../../../core/store/app.state';

import { sendMessage, canSendMessage } from './services/message-sender';
import {
  handleCompositionStart,
  handleCompositionEnd,
  adjustTextareaHeight,
  handleKeyDown,
} from './utils';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 flex items-center justify-center">
      <!-- Input Area -->
      <div
        class="flex gap-2 flex-col w-9/12 bg-[var(--secondary-bg)] border-1 border-[var(--border-color)] rounded-3xl p-2"
      >
        <!-- Text Input -->
        <textarea
          #messageTextarea
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          (compositionstart)="onCompositionStart()"
          (compositionend)="onCompositionEnd()"
          placeholder="このプロジェクトについて教えて下さい。"
          class="m-2 focus:outline-none resize-none placeholder:text-[var(--text-muted)] bg-transparent text-[var(--text-primary)]"
          rows="1"
        ></textarea>

        <!-- Text Input Footer -->
        <div class="flex w-full justify-end">
          <p-button
            (onClick)="onSendMessage()"
            [disabled]="!canSend()"
            [loading]="sending()"
            icon="pi pi-arrow-up"
            [rounded]="true"
            [text]="false"
            [raised]="true"
            severity="contrast"
            size="small"
          />
        </div>
      </div>
    </div>
  `,
})
export class MessageInputComponent {
  @ViewChild('messageTextarea') messageTextarea!: ElementRef<HTMLTextAreaElement>;

  protected appStore = inject(AppStore);
  private websocket = inject(WebSocketService);
  private messageService = inject(MessageService);

  // Events
  messageSent = output<{ content: string }>();

  messageText = signal<string>('');
  sending = signal(false);
  isComposing = signal(false);

  // 分離されたサービス関数をコンポーネントメソッドとして公開
  canSend = (): boolean => {
    return canSendMessage(this.messageText(), this.sending());
  };

  onSendMessage = async (): Promise<void> => {
    if (!this.canSend()) return;

    await sendMessage(
      this.messageText(),
      this.appStore,
      this.websocket,
      this.messageService,
      this.messageTextarea,
      this.sending,
      this.messageText,
      this.messageSent
    );
  };

  onKeyDown = (event: KeyboardEvent): void => {
    handleKeyDown(event, this.isComposing(), this.onSendMessage, () => this.adjustTextareaHeight());
  };

  onCompositionStart = (): void => {
    handleCompositionStart(this.isComposing);
  };

  onCompositionEnd = (): void => {
    handleCompositionEnd(this.isComposing);
  };

  private adjustTextareaHeight = (): void => {
    adjustTextareaHeight(this.messageTextarea);
  };
}
