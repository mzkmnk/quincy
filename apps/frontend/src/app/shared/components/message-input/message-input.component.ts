import { Component, signal, ViewChild, ElementRef, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ButtonModule } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { TextareaModule } from 'primeng/textarea';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule, FormsModule, ButtonModule, Tag, TextareaModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4 flex items-center justify-center">
      <!-- File Upload Area (when dragging) -->
      @if (isDragging()) {
        <div class="border-2 border-dashed border-blue-300 rounded-lg p-8 mb-4 bg-blue-50 text-center">
          <i class="pi pi-upload text-blue-400 text-4xl mb-2 block"></i>
          <p class="text-blue-600 font-medium">Drop files here to upload</p>
        </div>
      }

      <!-- Attached Files -->
      @if (attachedFiles().length > 0) {
        <div class="mb-4">
          <div class="flex flex-wrap gap-2">
            @for (file of attachedFiles(); track file.name) {
              <p-tag 
                [value]="file.name" 
                icon="pi pi-file"
                severity="info"
              >
                <button 
                  (click)="removeFile(file)"
                  class="ml-2 text-xs text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </p-tag>
            }
          </div>
        </div>
      }

      <!-- Input Area -->
      <div class="flex gap-2 flex-col w-9/12 bg-white border-1 border-gray-200 rounded-3xl p-2">
        <!-- Text Input -->
        <textarea
          #messageTextarea
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          placeholder="このプロジェクトについて教えて下さい。"
          class="m-2 focus:outline-none resize-none placeholder:text-gray-500"
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
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  protected appStore = inject(AppStore);
  private websocket = inject(WebSocketService);
  private messageService = inject(MessageService);

  // Events
  messageSent = output<{ content: string; files: File[] }>();

  messageText = signal<string>('');
  sending = signal(false);
  isDragging = signal(false);
  attachedFiles = signal<File[]>([]);

  canSend(): boolean {
    return (this.messageText().trim().length > 0 || this.attachedFiles().length > 0) && !this.sending();
  }

  async sendMessage(): Promise<void> {
    if (!this.canSend()) return;

    const content = this.messageText().trim();
    const files = this.attachedFiles();
    const currentSession = this.appStore.currentQSession();

    if (!currentSession) {
      console.error('No active session to send message to');
      return;
    }

    this.sending.set(true);

    try {
      console.log('Sending message to Amazon Q:', content);

      // Emit message sent event for parent component to handle
      this.messageSent.emit({ content, files });

      // Send message to Amazon Q CLI via WebSocket
      await this.websocket.sendQMessage(currentSession.sessionId, content);

      // Clear input
      this.messageText.set('');
      this.attachedFiles.set([]);

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
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    } else if (event.key === 'Enter' && event.shiftKey) {
      // Allow new line
      setTimeout(() => this.adjustTextareaHeight(), 0);
    }
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.attachedFiles.update(existing => [...existing, ...newFiles]);
      input.value = ''; // Reset input
    }
  }

  removeFile(fileToRemove: File): void {
    this.attachedFiles.update(files =>
      files.filter(file => file !== fileToRemove)
    );
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    const currentTarget = event.currentTarget as HTMLElement;
    if (!event.relatedTarget || !currentTarget?.contains(event.relatedTarget as Node)) {
      this.isDragging.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    if (event.dataTransfer?.files) {
      const droppedFiles = Array.from(event.dataTransfer.files);
      this.attachedFiles.update(existing => [...existing, ...droppedFiles]);
    }
  }

  private adjustTextareaHeight(): void {
    if (this.messageTextarea) {
      const textarea = this.messageTextarea.nativeElement;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
    }
  }
}