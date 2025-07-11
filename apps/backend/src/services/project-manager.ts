import { promises as fs } from 'fs';
import * as path from 'path';
import type { 
  Project, 
  ProjectScanResult, 
  ProjectCreateRequest, 
  ProjectUpdateRequest 
} from '@quincy/shared';
import { ProjectDetectionService } from './project-detection';

export class ProjectManager {
  private projects: Map<string, Project> = new Map();
  private cacheFilePath: string;

  constructor(
    private projectDetection: ProjectDetectionService,
    private basePath: string = process.env.HOME || '/tmp'
  ) {
    this.cacheFilePath = path.join(this.basePath, '.quincy-projects-cache.json');
    this.loadProjectCache();
  }

  /**
   * プロジェクトスキャンを実行しキャッシュを更新
   */
  async scanProjects(): Promise<ProjectScanResult> {
    const scanPath = path.join(this.basePath, '.amazon-q', 'projects');
    
    try {
      // ディレクトリが存在しない場合は作成
      await fs.mkdir(scanPath, { recursive: true });
    } catch (error) {
      console.warn(`Failed to create scan directory ${scanPath}:`, error);
    }

    const result = await this.projectDetection.scanForProjects(scanPath);

    // 新しく検出されたプロジェクトをキャッシュに追加/更新
    for (const project of result.projects) {
      this.projects.set(project.id, project);
    }

    // キャッシュを保存
    await this.saveProjectCache();

    return result;
  }

  /**
   * 全プロジェクト一覧を取得
   */
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  /**
   * 指定されたIDのプロジェクトを取得
   */
  async getProject(id: string): Promise<Project | null> {
    return this.projects.get(id) || null;
  }

  /**
   * 新しいプロジェクトを手動で作成
   */
  async createProject(request: ProjectCreateRequest): Promise<Project> {
    // バリデーション
    if (!request.name || request.name.trim() === '') {
      throw new Error('Project name cannot be empty');
    }

    // 同じパスのプロジェクトが既に存在するかチェック
    const existingProject = Array.from(this.projects.values())
      .find(p => p.path === request.path);
    
    if (existingProject) {
      throw new Error(`Project with path ${request.path} already exists`);
    }

    const now = Date.now();
    const project: Project = {
      id: this.generateProjectId(),
      name: request.name.trim(),
      description: request.description?.trim(),
      path: request.path,
      isManual: true,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now
    };

    // メタデータを抽出（パスが存在する場合）
    try {
      const stats = await fs.stat(request.path);
      if (stats.isDirectory()) {
        project.metadata = await this.projectDetection.extractMetadata(request.path);
      }
    } catch {
      // パスが存在しない場合はメタデータなしで作成
    }

    this.projects.set(project.id, project);
    await this.saveProjectCache();

    return project;
  }

  /**
   * プロジェクトを更新
   */
  async updateProject(id: string, request: ProjectUpdateRequest): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }

    // バリデーション
    if (request.name !== undefined && request.name.trim() === '') {
      throw new Error('Project name cannot be empty');
    }

    const updatedProject: Project = {
      ...project,
      name: request.name !== undefined ? request.name.trim() : project.name,
      description: request.description !== undefined ? request.description?.trim() : project.description,
      updatedAt: Date.now()
    };

    this.projects.set(id, updatedProject);
    await this.saveProjectCache();

    return updatedProject;
  }

  /**
   * プロジェクトを削除（手動プロジェクトのみ）
   */
  async deleteProject(id: string): Promise<void> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }

    if (!project.isManual) {
      throw new Error('Cannot delete detected project. Only manually added projects can be deleted.');
    }

    this.projects.delete(id);
    await this.saveProjectCache();
  }

  /**
   * プロジェクトのメタデータをリフレッシュ
   */
  async refreshProject(id: string): Promise<Project> {
    const project = this.projects.get(id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }

    try {
      const metadata = await this.projectDetection.extractMetadata(project.path);
      const refreshedProject: Project = {
        ...project,
        metadata,
        updatedAt: Date.now()
      };

      this.projects.set(id, refreshedProject);
      await this.saveProjectCache();

      return refreshedProject;
    } catch (error) {
      throw new Error(`Failed to refresh project metadata: ${error}`);
    }
  }

  /**
   * プロジェクトキャッシュをファイルから読み込み
   */
  private async loadProjectCache(): Promise<void> {
    try {
      const cacheData = await fs.readFile(this.cacheFilePath, 'utf-8');
      const projects: Project[] = JSON.parse(cacheData);
      
      this.projects.clear();
      for (const project of projects) {
        this.projects.set(project.id, project);
      }
    } catch (error) {
      // キャッシュファイルが存在しない場合は空でスタート
      console.log('No project cache found, starting fresh');
    }
  }

  /**
   * プロジェクトキャッシュをファイルに保存
   */
  private async saveProjectCache(): Promise<void> {
    try {
      const projects = Array.from(this.projects.values());
      const cacheData = JSON.stringify(projects, null, 2);
      await fs.writeFile(this.cacheFilePath, cacheData, 'utf-8');
    } catch (error) {
      console.error('Failed to save project cache:', error);
    }
  }

  /**
   * ユニークなプロジェクトIDを生成
   */
  private generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * プロジェクトの最終アクセス時間を更新
   */
  async updateLastAccessed(id: string): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      project.lastAccessedAt = Date.now();
      await this.saveProjectCache();
    }
  }

  /**
   * キャッシュクリア
   */
  async clearCache(): Promise<void> {
    this.projects.clear();
    try {
      await fs.unlink(this.cacheFilePath);
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
}