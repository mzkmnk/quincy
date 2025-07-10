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
    <div class="p-8 max-w-screen-xl mx-auto">
      <header class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 class="m-0 text-gray-800">Projects</h1>
        <button class="py-2 px-4 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-600" 
                (click)="createProject()">
          Create New Project
        </button>
      </header>

      @if (appStore.loading()) {
        <div class="text-center py-8 text-lg">Loading projects...</div>
      }

      @if (appStore.error()) {
        <div class="text-center py-8 text-lg text-red-600 bg-red-50 border border-red-200 rounded p-4">{{ appStore.error() }}</div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        @for (project of appStore.projects(); track project.id) {
          <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm transition-all duration-200 hover:shadow-md"
               [class.border-blue-500]="isSelected(project)"
               [class.bg-blue-50]="isSelected(project)">
            <h3 class="m-0 mb-4 text-gray-800">{{ project.name }}</h3>
            <div class="flex gap-2 flex-wrap">
              <button class="py-2 px-4 border border-green-500 rounded bg-green-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-green-600" 
                      (click)="selectProject(project)">
                {{ isSelected(project) ? 'Selected' : 'Select' }}
              </button>
              <button class="py-2 px-4 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
                      (click)="editProject(project)">
                Edit
              </button>
              <button class="py-2 px-4 border border-red-500 rounded bg-red-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-red-600" 
                      (click)="deleteProject(project)">
                Delete
              </button>
            </div>
          </div>
        } @empty {
          <div class="col-span-full text-center py-12 text-gray-600">
            <p class="mb-4">No projects found. Create your first project to get started!</p>
            <button class="py-2 px-4 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-600" 
                    (click)="createProject()">
              Create Project
            </button>
          </div>
        }
      </div>

      <div class="flex gap-4">
        <button class="py-2 px-4 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
                (click)="goBack()">
          Back to Dashboard
        </button>
      </div>
    </div>
  `,
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