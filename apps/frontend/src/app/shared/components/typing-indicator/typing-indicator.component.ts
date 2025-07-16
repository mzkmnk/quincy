import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-typing-indicator',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center space-x-2 bg-[#0d0d0d] rounded-lg px-4 py-3 shadow-sm border border-[#2f2f2f]">
      <span class="text-[#d9d9d9] text-sm">Amazon Q is thinking</span>
      <div class="flex space-x-1">
        <div class="w-2 h-2 bg-[#8a8a8a] rounded-full animate-bounce" style="animation-delay: 0ms;"></div>
        <div class="w-2 h-2 bg-[#8a8a8a] rounded-full animate-bounce" style="animation-delay: 150ms;"></div>
        <div class="w-2 h-2 bg-[#8a8a8a] rounded-full animate-bounce" style="animation-delay: 300ms;"></div>
      </div>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    
    .animate-bounce {
      animation: bounce 1.4s infinite;
    }
    
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        transform: translate3d(0, -4px, 0);
      }
      70% {
        transform: translate3d(0, -2px, 0);
      }
      90% {
        transform: translate3d(0, -1px, 0);
      }
    }
  `]
})
export class TypingIndicatorComponent {}