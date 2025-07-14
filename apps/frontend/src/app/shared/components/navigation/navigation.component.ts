import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-navigation',
  imports: [CommonModule, RouterModule, Menubar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-menubar class="fixed top-0 left-0 right-0 z-50">
      <ng-template pTemplate="start">
        <a routerLink="/chat" class="no-underline">
          <h1 class="m-0 text-2xl font-semibold text-blue-500">Quincy</h1>
        </a>
      </ng-template>
      
      <ng-template pTemplate="end">
        <div class="flex items-center gap-2 text-sm">
          <i 
            class="pi pi-circle-fill text-xs"
            [class.text-green-500]="websocket.connected()"
            [class.text-orange-500]="websocket.connecting()"
            [class.animate-pulse]="websocket.connecting()"
            [class.text-red-500]="!websocket.connected() && !websocket.connecting()"
          ></i>
          <span class="text-surface-600 font-medium hidden md:inline">
            {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting' : 'Disconnected' }}
          </span>
        </div>
      </ng-template>
    </p-menubar>
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