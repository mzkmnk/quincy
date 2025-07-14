import { Component, input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Button } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-amazon-q-message',
  imports: [CommonModule, Button, TypingIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Amazon Q Answer - Center aligned Q&A style -->
    <div class="flex justify-center mb-6">
      <div class="w-full max-w-4xl">
        @if (showHeader()) {
          <div class="flex items-center gap-2 mb-3 justify-center">
            <div class="w-7 h-7 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">
              <i class="pi pi-android"></i>
            </div>
            <span class="font-semibold text-gray-800">Amazon Q</span>
            <span class="text-xs text-gray-500">{{ formatTime(timestamp()) }}</span>
            @if (!isTyping() && showCopyButton()) {
              <p-button 
                icon="pi pi-copy"
                [text]="true"
                [rounded]="true"
                size="small"
                (onClick)="copyMessage()"
                title="Copy message"
                severity="secondary"
                class="ml-auto"
              />
            }
          </div>
        }
        @if (withBackground()) {
          <div class="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
            @if (isTyping()) {
              <app-typing-indicator></app-typing-indicator>
            } @else {
              <div class="text-gray-700 leading-relaxed whitespace-pre-wrap break-words prose prose-gray max-w-none">{{ content() }}</div>
            }
          </div>
        } @else {
          @if (isTyping()) {
            <app-typing-indicator></app-typing-indicator>
          } @else {
            <div class="text-gray-700 leading-relaxed whitespace-pre-wrap break-words prose prose-gray max-w-none">{{ content() }}</div>
          }
        }
      </div>
    </div>
  `
})
export class AmazonQMessageComponent {
  private messageService = inject(MessageService);

  content = input.required<string>();
  timestamp = input<Date>(new Date());
  isTyping = input<boolean>(false);
  showHeader = input<boolean>(true);
  showCopyButton = input<boolean>(true);
  withBackground = input<boolean>(true);

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  copyMessage(): void {
    navigator.clipboard.writeText(this.content()).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'コピー完了',
        detail: 'メッセージをクリップボードにコピーしました',
        life: 3000
      });
    }).catch(err => {
      console.error('Failed to copy message:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'エラー',
        detail: 'メッセージのコピーに失敗しました',
        life: 3000
      });
    });
  }
}