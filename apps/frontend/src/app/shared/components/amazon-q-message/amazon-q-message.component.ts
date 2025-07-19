import { Component, input, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';
import { shouldShowTyping, formatMessageContent } from './utils';

@Component({
  selector: 'app-amazon-q-message',
  imports: [CommonModule, TypingIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Amazon Q Answer - Center aligned Q&A style -->
    <div class="flex justify-center mb-6">
      <div class="w-full max-w-4xl">
        @if (showTyping()) {
          <app-typing-indicator></app-typing-indicator>
        } @else {
          <div class="text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words prose prose-gray max-w-none">{{ formattedContent() }}</div>
        }
      </div>
    </div>
  `
})
export class AmazonQMessageComponent {
  content = input.required<string>();
  isTyping = input<boolean>(false);

  showTyping = computed(() => shouldShowTyping(this.isTyping()));
  formattedContent = computed(() => formatMessageContent(this.content()));
}