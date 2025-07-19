import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';
import { getConnectionStatusClass, getConnectionStatusText } from './utils';

@Component({
  selector: 'app-navigation',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-[var(--secondary-bg)] border-b border-[var(--border-color)]">
      <div class="px-6 h-16 flex items-center justify-between">
        <a routerLink="/chat" class="no-underline">
          <h1 class="text-2xl font-semibold text-[var(--text-primary)] hover:text-[var(--text-primary)] transition-colors">Quincy</h1>
        </a>
        
        <div class="flex items-center gap-2 text-sm">
          <span 
            class="w-2 h-2 rounded-full"
            [class]="connectionStatusClass()"
          ></span>
          <span class="text-[var(--text-secondary)] font-medium hidden md:inline">
            {{ connectionStatusText() }}
          </span>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    @reference "tailwindcss";
    .router-link-active {
      @apply text-[var(--text-primary)] bg-[var(--tertiary-bg)];
    }
  `]
})
export class NavigationComponent {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);

  connectionStatusClass = computed(() => 
    getConnectionStatusClass(this.websocket.connected(), this.websocket.connecting())
  );

  connectionStatusText = computed(() => 
    getConnectionStatusText(this.websocket.connected(), this.websocket.connecting())
  );
}