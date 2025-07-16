import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-navigation',
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d] border-b border-[#2f2f2f]">
      <div class="px-6 h-16 flex items-center justify-between">
        <a routerLink="/chat" class="no-underline">
          <h1 class="text-2xl font-semibold text-white hover:text-[#ffffff] transition-colors">Quincy</h1>
        </a>
        
        <div class="flex items-center gap-2 text-sm">
          <span 
            class="w-2 h-2 rounded-full"
            [class.bg-green-500]="websocket.connected()"
            [class.bg-orange-500]="websocket.connecting()"
            [class.animate-pulse]="websocket.connecting()"
            [class.bg-red-500]="!websocket.connected() && !websocket.connecting()"
          ></span>
          <span class="text-[#d9d9d9] font-medium hidden md:inline">
            {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
          </span>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    @reference "tailwindcss";
    .router-link-active {
      @apply text-white bg-[#1a1a1a];
    }
  `]
})
export class NavigationComponent {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);
}