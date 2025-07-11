import { promises as fs } from 'fs';
import * as path from 'path';
import type { 
  Project, 
  ProjectScanResult
} from '@quincy/shared';
export class ProjectManager {
  constructor(
    private basePath: string = process.env.HOME || '/tmp'
  ) {}

  /**
   * Amazon Q CLIセッション情報からプロジェクトを取得
   * 注: ユーザーが指定したパスのみを扱い、独自の判定ロジックは使用しない
   */
  async scanProjects(): Promise<ProjectScanResult> {
    const startTime = Date.now();
    const projects: Project[] = [];
    const errors: string[] = [];

    // モック実装: 実際はAmazon Q CLIが管理するセッション情報から取得
    // 現在のワーキングディレクトリをサンプルとして返す
    const currentDir = process.cwd();
    projects.push({
      id: this.generateProjectId(currentDir),
      name: path.basename(currentDir),
      path: currentDir
    });

    const scanDuration = Date.now() - startTime;

    return {
      projects,
      scannedDirectories: 0, // スキャンは行わない
      errors,
      scanDuration
    };
  }


  /**
   * 全プロジェクト一覧を取得（Amazon Q CLIセッション情報から）
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

  /**
   * プロジェクトパスからユニークなIDを生成
   */
  private generateProjectId(projectPath: string): string {
    // パスをbase64エンコードしてIDとして使用
    const pathHash = Buffer.from(projectPath).toString('base64')
      .replace(/[^a-zA-Z0-9]/g, '');
    return `project_${pathHash}`;
  }

}