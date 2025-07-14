import { Component, signal, ViewChild, ElementRef, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4">
      <!-- File Upload Area (when dragging) -->
      @if (isDragging()) {
        <div class="border-2 border-dashed border-blue-300 rounded-lg p-8 mb-4 bg-blue-50 text-center">
          <svg class="w-8 h-8 text-blue-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p class="text-blue-600 font-medium">Drop files here to upload</p>
        </div>
      }

      <!-- Attached Files -->
      @if (attachedFiles().length > 0) {
        <div class="mb-4">
          <div class="flex flex-wrap gap-2">
            @for (file of attachedFiles(); track file.name) {
              <div class="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm">
                <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                </svg>
                <span class="text-gray-700">{{ file.name }}</span>
                <button 
                  (click)="removeFile(file)"
                  class="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Input Area -->
       <!-- TODO: テキストエリアを真ん中にする -->
      <div 
        class="flex items-end gap-2 p-3 border w-190 border-gray-200 rounded-3xl bg-white focus-within:border-blue-500 transition-colors"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <!-- Text Input -->
        <textarea
          #messageTextarea
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          placeholder="このプロジェクトについて教えてください。"
          class="flex-1 resize-none border-0 bg-transparent focus:ring-0 focus:outline-none text-gray-900 placeholder-gray-500 max-h-32 min-h-[40px]"
          rows="3"
          [disabled]="sending()"
        ></textarea>

        <!-- Send Button -->
        <button
          type="button"
          (click)="sendMessage()"
          [disabled]="!canSend()"
          class="flex-shrink-0 p-2 rounded-full transition-all duration-200"
          [class.bg-blue-500]="canSend()"
          [class.text-white]="canSend()"
          [class.hover:bg-blue-600]="canSend()"
          [class.bg-gray-100]="!canSend()"
          [class.text-gray-400]="!canSend()"
          [class.cursor-not-allowed]="!canSend()"
        >
          @if (sending()) {
            <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          } @else {
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
            </svg>
          }
        </button>
      </div>
    </div>
  `
})
export class MessageInputComponent {
  @ViewChild('messageTextarea') messageTextarea!: ElementRef<HTMLTextAreaElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  protected appStore = inject(AppStore);
  private websocket = inject(WebSocketService);

  // Events
  messageSent = output<{ content: string; files: File[] }>();

  messageText = '';
  sending = signal(false);
  isDragging = signal(false);
  attachedFiles = signal<File[]>([]);

  canSend(): boolean {
    return (this.messageText.trim().length > 0 || this.attachedFiles().length > 0) && !this.sending();
  }

  async sendMessage(): Promise<void> {
    if (!this.canSend()) return;

    const content = this.messageText.trim();
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
      this.messageText = '';
      this.attachedFiles.set([]);

      // Reset textarea height
      if (this.messageTextarea) {
        this.messageTextarea.nativeElement.style.height = 'auto';
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast to user
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