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
    <div class="p-8 max-w-screen-xl mx-auto">
      <header class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 class="m-0 text-gray-800">Sessions</h1>
        <button class="py-2 px-4 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-600 disabled:bg-gray-300 disabled:border-gray-300 disabled:cursor-not-allowed" 
                (click)="createSession()" [disabled]="!appStore.currentProject()">
          Create New Session
        </button>
      </header>

      @if (!appStore.currentProject()) {
        <div class="text-center py-8 bg-orange-50 border border-orange-200 rounded mb-8">
          <p class="mb-4 text-orange-800">Please select a project first to view sessions.</p>
          <button class="py-2 px-4 border border-green-500 rounded bg-green-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-green-600" 
                  (click)="goToProjects()">
            Select Project
          </button>
        </div>
      }

      @if (appStore.loading()) {
        <div class="text-center py-8 text-lg">Loading sessions...</div>
      }

      @if (appStore.error()) {
        <div class="text-center py-8 text-lg text-red-600 bg-red-50 border border-red-200 rounded p-4">{{ appStore.error() }}</div>
      }

      @if (appStore.currentProject()) {
        <div class="mb-8">
          <h2 class="m-0 text-gray-800 text-xl">Sessions for: {{ appStore.currentProject()?.name }}</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          @for (session of appStore.currentProjectSessions(); track session.id) {
            <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm transition-all duration-200 hover:shadow-md"
                 [class.border-blue-500]="isSelected(session)"
                 [class.bg-blue-50]="isSelected(session)">
              <h3 class="m-0 mb-2 text-gray-800">Session {{ session.id }}</h3>
              <p class="m-0 mb-4 text-gray-600 text-sm">Project: {{ session.projectId }}</p>
              <div class="flex gap-2 flex-wrap">
                <button class="py-2 px-4 border border-green-500 rounded bg-green-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-green-600" 
                        (click)="selectSession(session)">
                  {{ isSelected(session) ? 'Selected' : 'Select' }}
                </button>
                <button class="py-2 px-4 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
                        (click)="editSession(session)">
                  Edit
                </button>
                <button class="py-2 px-4 border border-red-500 rounded bg-red-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-red-600" 
                        (click)="deleteSession(session)">
                  Delete
                </button>
              </div>
            </div>
          } @empty {
            <div class="col-span-full text-center py-12 text-gray-600">
              <p class="mb-4">No sessions found for this project. Create your first session to get started!</p>
              <button class="py-2 px-4 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-600" 
                      (click)="createSession()">
                Create Session
              </button>
            </div>
          }
        </div>
      }

      <div class="flex gap-4">
        <button class="py-2 px-4 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
                (click)="goBack()">
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
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