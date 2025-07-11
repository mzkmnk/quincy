import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.state';
import { WebSocketService } from '../../core/services/websocket.service';
import type { Project } from '@quincy/shared';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    this.setupMockData();
  }

  private setupMockData(): void {
    // Add some mock projects for testing the new UI
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'E-commerce Platform',
        path: '/home/user/projects/ecommerce-platform'
      },
      {
        id: '2', 
        name: 'Mobile App Development',
        path: '/home/user/projects/mobile-app'
      },
      {
        id: '3',
        name: 'AI Chatbot Integration',
        path: '/home/user/projects/ai-chatbot'
      }
    ];

    const mockSessions = [
      {
        id: 'session-1',
        projectId: '1',
        title: 'Initial setup discussion',
        createdAt: new Date('2024-01-15'),
        lastActivity: new Date('2024-01-20')
      },
      {
        id: 'session-2',
        projectId: '1',
        title: 'Database schema planning',
        createdAt: new Date('2024-01-16'),
        lastActivity: new Date('2024-01-19')
      },
      {
        id: 'session-3',
        projectId: '2',
        title: 'UI/UX design review',
        createdAt: new Date('2024-01-12'),
        lastActivity: new Date('2024-01-18')
      }
    ];

    this.appStore.setProjects(mockProjects);
    this.appStore.setSessions(mockSessions);
    
    // Set the first project as current for demo
    this.appStore.setCurrentProject(mockProjects[0]);
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