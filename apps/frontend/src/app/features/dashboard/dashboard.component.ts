import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-screen-xl mx-auto">
      <header class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 class="m-0 text-gray-800">Quincy Dashboard</h1>
        <div class="flex items-center gap-4">
          <span class="py-2 px-4 rounded text-sm font-medium bg-gray-100 text-gray-600"
                [class.bg-green-100]="websocket.connected()"
                [class.text-green-800]="websocket.connected()"
                [class.bg-orange-100]="websocket.connecting()"
                [class.text-orange-800]="websocket.connecting()">
            {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting...' : 'Disconnected' }}
          </span>
          @if (websocket.error()) {
            <span class="text-red-600 text-sm">{{ websocket.error() }}</span>
          }
        </div>
      </header>

      <main class="flex flex-col gap-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 class="m-0 mb-4 text-gray-600 text-sm font-medium uppercase">Projects</h3>
            <p class="text-2xl font-bold text-gray-800 m-0">{{ appStore.projects().length }}</p>
            <p class="text-gray-600 text-sm mt-2 mb-0">Total Projects</p>
          </div>
          
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 class="m-0 mb-4 text-gray-600 text-sm font-medium uppercase">Sessions</h3>
            <p class="text-2xl font-bold text-gray-800 m-0">{{ appStore.sessions().length }}</p>
            <p class="text-gray-600 text-sm mt-2 mb-0">Total Sessions</p>
          </div>
          
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 class="m-0 mb-4 text-gray-600 text-sm font-medium uppercase">Current Project</h3>
            <p class="text-lg text-gray-800 m-0">{{ appStore.currentProject()?.name || 'None selected' }}</p>
          </div>
          
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 class="m-0 mb-4 text-gray-600 text-sm font-medium uppercase">Current Session</h3>
            <p class="text-lg text-gray-800 m-0">{{ appStore.currentSession()?.id || 'None selected' }}</p>
          </div>
        </div>

        <div class="flex gap-4 flex-wrap">
          <button class="py-3 px-6 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-600" 
                  (click)="navigateToProjects()">
            Manage Projects
          </button>
          <button class="py-3 px-6 border border-green-500 rounded bg-green-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-green-600" 
                  (click)="navigateToSessions()">
            View Sessions
          </button>
          <button class="py-3 px-6 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
                  (click)="toggleConnection()">
            {{ websocket.connected() ? 'Disconnect' : 'Connect' }}
          </button>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  protected appStore = inject(AppStore);
  protected websocket = inject(WebSocketService);
  private router = inject(Router);

  ngOnInit(): void {
    this.websocket.connect();
  }

  navigateToProjects(): void {
    this.router.navigate(['/projects']);
  }

  navigateToSessions(): void {
    this.router.navigate(['/sessions']);
  }

  toggleConnection(): void {
    if (this.websocket.connected()) {
      this.websocket.disconnect();
    } else {
      this.websocket.connect();
    }
  }
}