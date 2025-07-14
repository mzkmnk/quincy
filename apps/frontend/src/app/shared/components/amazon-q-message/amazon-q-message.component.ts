import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TypingIndicatorComponent } from '../typing-indicator/typing-indicator.component';

@Component({
  selector: 'app-amazon-q-message',
  imports: [CommonModule, TypingIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Amazon Q Answer - Center aligned Q&A style -->
    <div class="flex justify-center mb-6">
      <div class="w-full max-w-4xl">
        @if (isTyping()) {
          <app-typing-indicator></app-typing-indicator>
        } @else {
          <div class="text-gray-700 leading-relaxed whitespace-pre-wrap break-words prose prose-gray max-w-none">{{ content() }}</div>
        }
      </div>
    </div>
  `
})
export class AmazonQMessageComponent {
  content = input.required<string>();
  isTyping = input<boolean>(false);
}