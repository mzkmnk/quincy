import { Component, signal, ViewChild, ElementRef, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Button } from 'primeng/button';
import { InputTextarea } from 'primeng/inputtextarea';
import { FileUpload } from 'primeng/fileupload';
import { Tag } from 'primeng/tag';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-message-input',
  imports: [CommonModule, FormsModule, Button, InputTextarea, FileUpload, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-4">
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
                [removable]="true"
                (onRemove)="removeFile(file)"
              />
            }
          </div>
        </div>
      }

      <!-- Input Area -->
      <div 
        class="flex items-end gap-2"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <!-- Text Input -->
        <textarea
          #messageTextarea
          pInputTextarea
          [(ngModel)]="messageText"
          (keydown)="onKeyDown($event)"
          placeholder="Type your message..."
          class="flex-1 resize-none"
          rows="1"
          [disabled]="sending()"
          [autoResize]="true"
          [style]="{ maxHeight: '128px' }"
        ></textarea>

        <!-- Send Button -->
        <p-button
          (onClick)="sendMessage()"
          [disabled]="!canSend()"
          [loading]="sending()"
          icon="pi pi-send"
          [rounded]="true"
          [text]="false"
          [raised]="true"
          severity="primary"
          size="small"
        />
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