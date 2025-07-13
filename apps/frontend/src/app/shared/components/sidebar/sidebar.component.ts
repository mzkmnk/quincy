import { Component, input, inject, ChangeDetectionStrategy, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AppStore } from '../../../core/store/app.state';
import { ProjectListComponent } from '../project-list/project-list.component';
import { WebSocketService } from '../../../core/services/websocket.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule, ProjectListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col">
      <!-- New Project Button -->
      <div class="p-4">
        <button
          class="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center gap-2"
          [class.hidden]="collapsed()"
          (click)="createNewProject()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Project
        </button>
        <button
          class="w-full p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 flex items-center justify-center"
          [class.hidden]="!collapsed()"
          (click)="createNewProject()"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </button>
      </div>

      <!-- Projects List -->
      <app-project-list [collapsed]="collapsed()"></app-project-list>

      <!-- Navigation Links (Legacy) -->
      <div class="border-t border-gray-100 p-4 space-y-2" [class.hidden]="collapsed()">
        <a routerLink="/dashboard" routerLinkActive="bg-blue-50 text-blue-600 border-blue-200" 
           class="block w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
          Dashboard
        </a>
        <a routerLink="/projects" routerLinkActive="bg-blue-50 text-blue-600 border-blue-200"
           class="block w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
          Projects
        </a>
        <a routerLink="/sessions" routerLinkActive="bg-blue-50 text-blue-600 border-blue-200"
           class="block w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-sm">
          Sessions
        </a>
      </div>

      <!-- Collapsed Navigation -->
      <div class="border-t border-gray-100 p-2 space-y-2" [class.hidden]="!collapsed()">
        <a routerLink="/dashboard" routerLinkActive="bg-blue-50 text-blue-600" 
           class="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
           title="Dashboard">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"></path>
          </svg>
        </a>
        <a routerLink="/projects" routerLinkActive="bg-blue-50 text-blue-600"
           class="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
           title="Projects">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
        </a>
        <a routerLink="/sessions" routerLinkActive="bg-blue-50 text-blue-600"
           class="w-full p-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center"
           title="Sessions">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
          </svg>
        </a>
      </div>
    </div>
  `
})
export class SidebarComponent {
  collapsed = input<boolean>(false);
  protected appStore = inject(AppStore);
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);
  
  // モーダル表示要求を親コンポーネントに通知
  newProjectRequested = output<void>();

  createNewProject(): void {
    // 親コンポーネントにモーダル表示を要求
    this.newProjectRequested.emit();
  }
}