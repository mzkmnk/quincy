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
    <div class="dashboard">
      <header class="header">
        <h1>Quincy Dashboard</h1>
        <div class="connection-status">
          <span class="status-indicator" [class.connected]="websocket.connected()" [class.connecting]="websocket.connecting()">
            {{ websocket.connected() ? 'Connected' : websocket.connecting() ? 'Connecting...' : 'Disconnected' }}
          </span>
          @if (websocket.error()) {
            <span class="error">{{ websocket.error() }}</span>
          }
        </div>
      </header>

      <main class="main-content">
        <div class="stats-grid">
          <div class="stat-card">
            <h3>Projects</h3>
            <p class="stat-number">{{ appStore.projects().length }}</p>
            <p class="stat-label">Total Projects</p>
          </div>
          
          <div class="stat-card">
            <h3>Sessions</h3>
            <p class="stat-number">{{ appStore.sessions().length }}</p>
            <p class="stat-label">Total Sessions</p>
          </div>
          
          <div class="stat-card">
            <h3>Current Project</h3>
            <p class="stat-text">{{ appStore.currentProject()?.name || 'None selected' }}</p>
          </div>
          
          <div class="stat-card">
            <h3>Current Session</h3>
            <p class="stat-text">{{ appStore.currentSession()?.id || 'None selected' }}</p>
          </div>
        </div>

        <div class="actions">
          <button class="action-btn primary" (click)="navigateToProjects()">
            Manage Projects
          </button>
          <button class="action-btn secondary" (click)="navigateToSessions()">
            View Sessions
          </button>
          <button class="action-btn" (click)="toggleConnection()">
            {{ websocket.connected() ? 'Disconnect' : 'Connect' }}
          </button>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .header h1 {
      margin: 0;
      color: #333;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-indicator {
      padding: 0.5rem 1rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: #f5f5f5;
      color: #666;
    }

    .status-indicator.connected {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .status-indicator.connecting {
      background: #fff3e0;
      color: #f57c00;
    }

    .error {
      color: #d32f2f;
      font-size: 0.875rem;
    }

    .main-content {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .stat-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .stat-card h3 {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #333;
      margin: 0;
    }

    .stat-text {
      font-size: 1.125rem;
      color: #333;
      margin: 0;
    }

    .stat-label {
      color: #666;
      font-size: 0.875rem;
      margin: 0.5rem 0 0 0;
    }

    .actions {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .action-btn {
      padding: 0.75rem 1.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 0.25rem;
      background: white;
      color: #333;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f5f5f5;
    }

    .action-btn.primary {
      background: #2196f3;
      color: white;
      border-color: #2196f3;
    }

    .action-btn.primary:hover {
      background: #1976d2;
    }

    .action-btn.secondary {
      background: #4caf50;
      color: white;
      border-color: #4caf50;
    }

    .action-btn.secondary:hover {
      background: #388e3c;
    }
  `]
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