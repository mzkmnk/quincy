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
          Starting Amazon Q Session
        </h2>
        <p class="text-[var(--text-secondary)] mb-6 leading-relaxed">
          Please wait while we initialize your Amazon Q session...
        </p>
        <div class="space-y-3">
          <div
            class="flex items-center justify-center text-sm"
            [class.text-[var(--text-muted)]]="!sessionStatus().cliLaunched"
            [class.text-[var(--success)]]="sessionStatus().cliLaunched"
          >
            <span class="mr-2">🚀</span>
            <span>Launching Amazon Q CLI</span>
            @if (sessionStatus().cliLaunched) {
              <svg class="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            }
          </div>
          <div
            class="flex items-center justify-center text-sm"
            [class.text-[var(--text-muted)]]="!sessionStatus().connectionEstablished"
            [class.text-[var(--success)]]="sessionStatus().connectionEstablished"
          >
            <span class="mr-2">🔗</span>
            <span>Establishing connection</span>
            @if (sessionStatus().connectionEstablished) {
              <svg class="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            }
          </div>
          <div
            class="flex items-center justify-center text-sm"
            [class.text-[var(--text-muted)]]="!sessionStatus().workspaceReady"
            [class.text-[var(--success)]]="sessionStatus().workspaceReady"
          >
            <span class="mr-2">📂</span>
            <span>Setting up project workspace</span>
            @if (sessionStatus().workspaceReady) {
              <svg class="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
            }
          </div>
        </div>
        <p class="text-xs text-[var(--text-muted)] mt-4">This may take up to 30 seconds...</p>
      </div>
    </div>
  `,
})
export class SessionStartComponent {
  sessionStatus = input.required<SessionStatus>();
}
