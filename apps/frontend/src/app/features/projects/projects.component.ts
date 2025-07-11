import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AppStore } from '../../core/store/app.state';
import { ApiService } from '../../core/services/api.service';
import type { Project, ProjectCreateRequest, ProjectScanResult } from '@quincy/shared';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 max-w-screen-xl mx-auto">
      <header class="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
        <h1 class="m-0 text-gray-800">Projects</h1>
        <div class="flex gap-2">
          <button class="py-2 px-4 border border-gray-500 rounded bg-gray-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-600" 
                  (click)="scanProjects()"
                  [disabled]="appStore.loading()">
            {{ appStore.loading() ? 'Scanning...' : 'Scan Projects' }}
          </button>
          <button class="py-2 px-4 border border-blue-500 rounded bg-blue-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-600" 
                  (click)="createProject()">
            Create New Project
          </button>
        </div>
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
            <div class="mb-4">
              <h3 class="m-0 mb-2 text-gray-800">{{ project.name }}</h3>
              @if (project.description) {
                <p class="text-sm text-gray-600 mb-2">{{ project.description }}</p>
              }
              <div class="text-xs text-gray-500 space-y-1">
                <div>📁 {{ project.path }}</div>
                @if (project.metadata?.type) {
                  <div>🏷️ {{ project.metadata.type }}</div>
                }
                @if (project.metadata?.packageJson?.version) {
                  <div>📦 v{{ project.metadata.packageJson.version }}</div>
                }
                @if (project.isManual) {
                  <div class="text-blue-600">✋ Manual Project</div>
                } @else {
                  <div class="text-green-600">🔍 Detected Project</div>
                }
              </div>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button class="py-2 px-4 border border-green-500 rounded bg-green-500 text-white cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-green-600" 
                      (click)="selectProject(project)">
                {{ isSelected(project) ? 'Selected' : 'Select' }}
              </button>
              <button class="py-2 px-4 border border-gray-200 rounded bg-white text-gray-800 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-gray-50" 
                      (click)="editProject(project)">
                Edit
              </button>
              <button class="py-2 px-4 border border-blue-200 rounded bg-white text-blue-600 cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-blue-50" 
                      (click)="refreshProject(project)">
                Refresh
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
  private webSocketService = inject(WebSocketService);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadProjects();
    this.setupWebSocketListeners();
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
    const projectName = prompt('プロジェクト名を入力してください:');
    if (!projectName) return;

    const projectPath = prompt('プロジェクトパスを入力してください:', '/path/to/project');
    if (!projectPath) return;

    const createRequest: ProjectCreateRequest = {
      name: projectName,
      path: projectPath,
      description: prompt('プロジェクトの説明（オプション）:') || undefined
    };

    this.apiService.createProject(createRequest).subscribe({
      next: (project) => {
        this.appStore.addProject(project);
        console.log('プロジェクトが作成されました:', project);
      },
      error: (error) => {
        console.error('プロジェクトの作成に失敗しました:', error);
        this.appStore.setError('プロジェクトの作成に失敗しました');
      }
    });
  }

  editProject(project: Project): void {
    const newName = prompt('新しいプロジェクト名を入力してください:', project.name);
    if (!newName || newName === project.name) return;

    const newDescription = prompt('新しい説明を入力してください:', project.description || '');

    this.apiService.updateProject(project.id, {
      name: newName,
      description: newDescription || undefined
    }).subscribe({
      next: (updatedProject) => {
        this.appStore.updateProject(updatedProject);
        console.log('プロジェクトが更新されました:', updatedProject);
      },
      error: (error) => {
        console.error('プロジェクトの更新に失敗しました:', error);
        this.appStore.setError('プロジェクトの更新に失敗しました');
      }
    });
  }

  deleteProject(project: Project): void {
    if (confirm(`"${project.name}"を削除してもよろしいですか？`)) {
      this.apiService.deleteProject(project.id).subscribe({
        next: () => {
          this.appStore.removeProject(project.id);
          console.log('プロジェクトが削除されました:', project.name);
        },
        error: (error) => {
          console.error('プロジェクトの削除に失敗しました:', error);
          const errorMessage = error.error?.error || 'プロジェクトの削除に失敗しました';
          this.appStore.setError(errorMessage);
        }
      });
    }
  }

  scanProjects(): void {
    this.appStore.setLoading(true);
    this.apiService.scanProjects().subscribe({
      next: (result: ProjectScanResult) => {
        // スキャン結果から新しいプロジェクトを追加
        result.projects.forEach(project => {
          // 既存のプロジェクトかチェック
          const existingProject = this.appStore.projects().find(p => p.id === project.id);
          if (!existingProject) {
            this.appStore.addProject(project);
          } else {
            this.appStore.updateProject(project);
          }
        });
        
        console.log(`プロジェクトスキャンが完了しました: ${result.projects.length}個のプロジェクトが見つかりました`);
        this.appStore.setLoading(false);
      },
      error: (error) => {
        console.error('プロジェクトスキャンに失敗しました:', error);
        this.appStore.setError('プロジェクトスキャンに失敗しました');
      }
    });
  }

  refreshProject(project: Project): void {
    this.apiService.refreshProject(project.id).subscribe({
      next: (refreshedProject) => {
        this.appStore.updateProject(refreshedProject);
        console.log('プロジェクトがリフレッシュされました:', refreshedProject);
      },
      error: (error) => {
        console.error('プロジェクトのリフレッシュに失敗しました:', error);
        this.appStore.setError('プロジェクトのリフレッシュに失敗しました');
      }
    });
  }

  private setupWebSocketListeners(): void {
    this.webSocketService.connect();

    // プロジェクト作成イベント
    this.webSocketService.on<{ project: Project }>('project:created', (data) => {
      this.appStore.addProject(data.project);
    });

    // プロジェクト更新イベント
    this.webSocketService.on<{ project: Project }>('project:updated', (data) => {
      this.appStore.updateProject(data.project);
    });

    // プロジェクト削除イベント
    this.webSocketService.on<{ projectId: string }>('project:deleted', (data) => {
      this.appStore.removeProject(data.projectId);
    });

    // プロジェクトスキャン完了イベント
    this.webSocketService.on<{ result: ProjectScanResult }>('projects:scanned', (data) => {
      data.result.projects.forEach(project => {
        const existingProject = this.appStore.projects().find(p => p.id === project.id);
        if (!existingProject) {
          this.appStore.addProject(project);
        } else {
          this.appStore.updateProject(project);
        }
      });
      this.appStore.setLoading(false);
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}