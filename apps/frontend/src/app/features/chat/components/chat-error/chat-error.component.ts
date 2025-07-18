import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat-error',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex items-center justify-center">
      <div class="text-center max-w-md">
        <div class="mb-6">
          <svg class="w-24 h-24 text-[var(--error)] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <h2 class="text-2xl font-semibold text-[var(--error)] mb-4">Session Start Failed</h2>
        <p class="text-[var(--text-primary)] mb-6 leading-relaxed bg-[var(--error-bg)] border border-[var(--error-border)] rounded-lg p-4">
          {{ errorMessage() }}
        </p>
        <div class="space-y-2 text-sm text-[var(--text-secondary)]">
          <p class="font-medium">💡 Troubleshooting Tips:</p>
          <div class="text-left bg-[var(--tertiary-bg)] rounded-lg p-4">
            <p>1. Install Amazon Q CLI if not installed</p>
            <p>2. Ensure 'q' command is in your PATH</p>
            <p>3. Run 'q --version' in terminal to verify</p>
            <p>4. Restart the application after installation</p>
          </div>
        </div>
        <button 
          class="mt-6 px-4 py-2 bg-[var(--accent-blue)] text-[var(--text-primary)] rounded-md hover:bg-[var(--accent-hover)] transition-colors font-medium"
          (click)="tryAgain.emit()"
        >
          Try Again
        </button>
      </div>
    </div>
  `
})
export class ChatErrorComponent {
  errorMessage = input.required<string>();
  tryAgain = output<void>();
}