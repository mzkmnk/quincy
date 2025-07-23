import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface SessionStatus {
  cliLaunched: boolean;
  connectionEstablished: boolean;
  workspaceReady: boolean;
}

@Component({
  selector: 'app-session-start',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex items-center justify-center">
      <div class="text-center max-w-md">
        <div class="mb-6">
          <svg
            class="w-24 h-24 text-[var(--text-primary)] mx-auto animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            ></path>
          </svg>
        </div>
        <h2 class="text-2xl font-semibold text-[var(--text-primary)] mb-4">
          Loading...
        </h2>
        <p class="text-[var(--text-secondary)] mb-6 leading-relaxed">
          Please wait while we initialize your Amazon Q session...
        </p>
        <p class="text-xs text-[var(--text-muted)] mt-4">This may take up to 30 seconds...</p>
      </div>
    </div>
  `,
})
export class SessionStartComponent {
  sessionStatus = input.required<SessionStatus>();
}
