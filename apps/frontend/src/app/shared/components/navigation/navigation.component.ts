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
    <nav class="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-50 h-16">
      <div class="max-w-screen-xl mx-auto px-8 flex items-center justify-between h-full">
        <div class="flex items-center">
          <a routerLink="/dashboard" class="no-underline">
            <h1 class="m-0 text-2xl font-semibold text-blue-500">Quincy</h1>
          </a>
        </div>
        
        <div class="flex items-center gap-8 md:gap-4">
          <a routerLink="/dashboard" routerLinkActive="router-link-active" class="no-underline text-gray-600 font-medium py-2 px-4 rounded transition-all duration-200 hover:text-blue-500 hover:bg-gray-50 md:px-2 md:text-sm">
            Dashboard
          </a>
          <a routerLink="/projects" routerLinkActive="router-link-active" class="no-underline text-gray-600 font-medium py-2 px-4 rounded transition-all duration-200 hover:text-blue-500 hover:bg-gray-50 md:px-2 md:text-sm">
            Projects
          </a>
          <a routerLink="/sessions" routerLinkActive="router-link-active" class="no-underline text-gray-600 font-medium py-2 px-4 rounded transition-all duration-200 hover:text-blue-500 hover:bg-gray-50 md:px-2 md:text-sm">
            Sessions
          </a>
        </div>
        
        <div class="flex items-center">
          <div class="flex items-center gap-2 text-sm">
            <span 
              class="w-2 h-2 rounded-full bg-gray-300 transition-colors duration-200"
              [class.bg-green-500]="websocket.connected()"
              [class.bg-orange-500]="websocket.connecting()"
              [class.animate-pulse]="websocket.connecting()"
              [class.bg-red-500]="!websocket.connected() && !websocket.connecting()"
            ></span>
            <span class="text-gray-600 font-medium hidden md:inline">
              {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
            </span>
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    @reference "tailwindcss";
    .router-link-active {
      @apply text-blue-500 bg-blue-50;
    }
  `]
})
export class NavigationComponent {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);
}