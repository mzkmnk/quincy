import { Component, signal, ViewChild, ElementRef, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 flex items-center justify-center">
      <!-- Input Area -->
      <div class="flex gap-2 flex-col w-9/12 bg-[var(--secondary-bg)] border-1 border-[var(--border-color)] rounded-3xl p-2">
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
            (onClick)="sendMessage()"
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
  `
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

  canSend(): boolean {
    return this.messageText().trim().length > 0 && !this.sending();
  }

  async sendMessage(): Promise<void> {
    if (!this.canSend()) return;

    const content = this.messageText().trim();
    const currentSession = this.appStore.currentQSession();

    if (!currentSession) {
      console.error('No active session to send message to');
      return;
    }

    this.sending.set(true);

    try {
      console.log('Sending message to Amazon Q:', content);

      // Emit message sent event for parent component to handle
      this.messageSent.emit({ content });

      // Send message to Amazon Q CLI via WebSocket
      await this.websocket.sendQMessage(currentSession.sessionId, content);

      // Clear input
      this.messageText.set('');

      // Reset textarea height
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.style.height = 'auto';
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'エラー',
        detail: 'メッセージの送信に失敗しました',
        life: 5000
      });
    } finally {
      this.sending.set(false);
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !this.isComposing() && !event.isComposing) {
      event.preventDefault();
      this.sendMessage();
    } else if (event.key === 'Enter' && event.shiftKey) {
      // Allow new line
      setTimeout(() => this.adjustTextareaHeight(), 0);
    }
  }


  onCompositionStart(): void {
    this.isComposing.set(true);
  }

  onCompositionEnd(): void {
    this.isComposing.set(false);
  }

  private adjustTextareaHeight(): void {
    if (this.messageTextarea) {
      const textarea = this.messageTextarea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }
}