import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.state';
import { ApiService } from '../../core/services/api.service';
import type { Project } from '@quincy/shared';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="projects">
      <header class="header">
        <h1>Projects</h1>
        <button class="btn-primary" (click)="createProject()">
          Create New Project
        </button>
      </header>

      @if (appStore.loading()) {
        <div class="loading">Loading projects...</div>
      }

      @if (appStore.error()) {
        <div class="error">{{ appStore.error() }}</div>
      }

      <div class="projects-grid">
        @for (project of appStore.projects(); track project.id) {
          <div class="project-card" [class.selected]="isSelected(project)">
            <h3>{{ project.name }}</h3>
            <div class="project-actions">
              <button class="btn-secondary" (click)="selectProject(project)">
                {{ isSelected(project) ? 'Selected' : 'Select' }}
              </button>
              <button class="btn-outline" (click)="editProject(project)">
                Edit
              </button>
              <button class="btn-danger" (click)="deleteProject(project)">
                Delete
              </button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>No projects found. Create your first project to get started!</p>
            <button class="btn-primary" (click)="createProject()">
              Create Project
            </button>
          </div>
        }
      </div>

      <div class="actions">
        <button class="btn-outline" (click)="goBack()">
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
  styles: [`
    .projects {
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

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .project-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s;
    }

    .project-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .project-card.selected {
      border-color: #2196f3;
      background: #f3f9ff;
    }

    .project-card h3 {
      margin: 0 0 1rem 0;
      color: #333;
    }

    .project-actions {
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
export class ProjectsComponent implements OnInit {
  protected appStore = inject(AppStore);
  private apiService = inject(ApiService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadProjects();
  }

  private loadProjects(): void {
    this.appStore.setLoading(true);
    this.apiService.getProjects().subscribe({
      next: (projects) => this.appStore.setProjects(projects),
      error: (error) => this.appStore.setError('Failed to load projects')
    });
  }

  selectProject(project: Project): void {
    this.appStore.setCurrentProject(project);
  }

  isSelected(project: Project): boolean {
    return this.appStore.currentProject()?.id === project.id;
  }

  createProject(): void {
    // For now, create a mock project
    const newProject: Project = {
      id: Date.now().toString(),
      name: `Project ${Date.now()}`
    };
    this.appStore.addProject(newProject);
  }

  editProject(project: Project): void {
    // TODO: Implement edit functionality
    console.log('Edit project:', project);
  }

  deleteProject(project: Project): void {
    if (confirm(`Are you sure you want to delete "${project.name}"?`)) {
      // TODO: Implement delete functionality
      console.log('Delete project:', project);
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}