import { promises as fs } from 'fs';
import * as path from 'path';
import type { 
  Project, 
  ProjectScanResult
} from '@quincy/shared';
import { ProjectDetectionService } from './project-detection';

export class ProjectManager {
  constructor(
    private projectDetection: ProjectDetectionService,
    private basePath: string = process.env.HOME || '/tmp'
  ) {}

  /**
   * Amazon Q CLIのプロジェクトディレクトリをスキャン
   */
  async scanProjects(): Promise<ProjectScanResult> {
    // 一般的なプロジェクトディレクトリをスキャン
    const commonPaths = [
      path.join(this.basePath, 'Projects'),
      path.join(this.basePath, 'workspace'),
      path.join(this.basePath, 'src'),
      path.join(this.basePath, 'dev'),
      path.join(this.basePath, 'code')
    ];

    const allProjects: Project[] = [];
    const errors: string[] = [];
    let totalScannedDirectories = 0;
    const startTime = Date.now();

    for (const scanPath of commonPaths) {
      try {
        const stats = await fs.stat(scanPath);
        if (stats.isDirectory()) {
          const result = await this.projectDetection.scanForProjects(scanPath);
          allProjects.push(...result.projects);
          totalScannedDirectories += result.scannedDirectories;
          errors.push(...result.errors);
        }
      } catch {
        // ディレクトリが存在しない場合はスキップ
      }
    }

    const scanDuration = Date.now() - startTime;

    return {
      projects: allProjects,
      scannedDirectories: totalScannedDirectories,
      errors,
      scanDuration
    };
  }


  /**
   * 全プロジェクト一覧を取得（スキャン結果から直接取得）
   */
  async getProjects(): Promise<Project[]> {
    const scanResult = await this.scanProjects();
    return scanResult.projects;
  }

  /**
   * 指定されたIDのプロジェクトを取得
   */
  async getProject(id: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

}