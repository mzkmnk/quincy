import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.state';
import { ApiService } from '../../core/services/api.service';
import type { Session } from '@quincy/shared';

@Component({
  selector: 'app-sessions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sessions">
      <header class="header">
        <h1>Sessions</h1>
        <button class="btn-primary" (click)="createSession()" [disabled]="!appStore.currentProject()">
          Create New Session
        </button>
      </header>

      @if (!appStore.currentProject()) {
        <div class="warning">
          <p>Please select a project first to view sessions.</p>
          <button class="btn-secondary" (click)="goToProjects()">
            Select Project
          </button>
        </div>
      }

      @if (appStore.loading()) {
        <div class="loading">Loading sessions...</div>
      }

      @if (appStore.error()) {
        <div class="error">{{ appStore.error() }}</div>
      }

      @if (appStore.currentProject()) {
        <div class="project-info">
          <h2>Sessions for: {{ appStore.currentProject()?.name }}</h2>
        </div>

        <div class="sessions-grid">
          @for (session of appStore.currentProjectSessions(); track session.id) {
            <div class="session-card" [class.selected]="isSelected(session)">
              <h3>Session {{ session.id }}</h3>
              <p class="session-meta">Project: {{ session.projectId }}</p>
              <div class="session-actions">
                <button class="btn-secondary" (click)="selectSession(session)">
                  {{ isSelected(session) ? 'Selected' : 'Select' }}
                </button>
                <button class="btn-outline" (click)="editSession(session)">
                  Edit
                </button>
                <button class="btn-danger" (click)="deleteSession(session)">
                  Delete
                </button>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <p>No sessions found for this project. Create your first session to get started!</p>
              <button class="btn-primary" (click)="createSession()">
                Create Session
              </button>
            </div>
          }
        </div>
      }

      <div class="actions">
        <button class="btn-outline" (click)="goBack()">
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .sessions {
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

    .warning {
      text-align: center;
      padding: 2rem;
      background: #fff3e0;
      border: 1px solid #ffcc02;
      border-radius: 0.25rem;
      margin-bottom: 2rem;
    }

    .warning p {
      margin-bottom: 1rem;
      color: #f57c00;
    }

    .project-info {
      margin-bottom: 2rem;
    }

    .project-info h2 {
      margin: 0;
      color: #333;
      font-size: 1.25rem;
    }

    .loading, .error {
      text-align: center;
      padding: 2rem;
      font-size: 1.125rem;
    }

    .error {
      color: #d32f2f;
      background: #ffebee;
      border: 1px solid #ffcdd2;
      border-radius: 0.25rem;
    }

    .sessions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .session-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }

    .session-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .session-card.selected {
      border-color: #2196f3;
      background: #f3f9ff;
    }

    .session-card h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .session-meta {
      margin: 0 0 1rem 0;
      color: #666;
      font-size: 0.875rem;
    }

    .session-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .empty-state p {
      margin-bottom: 1rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
    }

    .btn-primary, .btn-secondary, .btn-outline, .btn-danger {
      padding: 0.5rem 1rem;
      border: 1px solid;
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #2196f3;
      color: white;
      border-color: #2196f3;
    }

    .btn-primary:hover {
      background: #1976d2;
    }

    .btn-primary:disabled {
      background: #ccc;
      border-color: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #4caf50;
      color: white;
      border-color: #4caf50;
    }

    .btn-secondary:hover {
      background: #388e3c;
    }

    .btn-outline {
      background: white;
      color: #333;
      border-color: #e0e0e0;
    }

    .btn-outline:hover {
      background: #f5f5f5;
    }

    .btn-danger {
      background: #f44336;
      color: white;
      border-color: #f44336;
    }

    .btn-danger:hover {
      background: #d32f2f;
    }
  `]
})
export class SessionsComponent implements OnInit {
  protected appStore = inject(AppStore);
  private apiService = inject(ApiService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadSessions();
  }

  private loadSessions(): void {
    const projectId = this.appStore.currentProject()?.id;
    if (!projectId) return;

    this.appStore.setLoading(true);
    this.apiService.getSessions(projectId).subscribe({
      next: (sessions) => this.appStore.setSessions(sessions),
      error: (error) => this.appStore.setError('Failed to load sessions')
    });
  }

  selectSession(session: Session): void {
    this.appStore.setCurrentSession(session);
  }

  isSelected(session: Session): boolean {
    return this.appStore.currentSession()?.id === session.id;
  }

  createSession(): void {
    const projectId = this.appStore.currentProject()?.id;
    if (!projectId) return;

    const newSession: Session = {
      id: `session-${Date.now()}`,
      projectId
    };
    this.appStore.addSession(newSession);
  }

  editSession(session: Session): void {
    // TODO: Implement edit functionality
    console.log('Edit session:', session);
  }

  deleteSession(session: Session): void {
    if (confirm(`Are you sure you want to delete session "${session.id}"?`)) {
      // TODO: Implement delete functionality
      console.log('Delete session:', session);
    }
  }

  goToProjects(): void {
    this.router.navigate(['/projects']);
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}