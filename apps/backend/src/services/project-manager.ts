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
   * Amazon Q CLIのセッション情報からプロジェクトを取得
   * 注: 実際の実装ではAmazon Q CLIの設定ディレクトリからセッション情報を読み取る
   */
  async scanProjects(): Promise<ProjectScanResult> {
    const startTime = Date.now();
    const projects: Project[] = [];
    const errors: string[] = [];

    try {
      // Amazon Q CLIの設定ディレクトリを確認
      const amazonQDir = path.join(this.basePath, '.amazon-q');
      const sessionsDir = path.join(amazonQDir, 'sessions');
      
      try {
        await fs.access(sessionsDir);
        // TODO: Amazon Q CLIのセッションディレクトリからセッション情報を読み取り
        // 現在はモックデータを返す
        
        // モック: 現在のワーキングディレクトリをプロジェクトとして返す
        const currentDir = process.cwd();
        projects.push({
          id: this.generateProjectId(currentDir),
          name: path.basename(currentDir),
          path: currentDir
        });
      } catch {
        // Amazon Q CLIのセッションディレクトリが存在しない
        errors.push('Amazon Q CLI sessions directory not found');
      }
    } catch (error) {
      errors.push(`Failed to access Amazon Q CLI directory: ${error}`);
    }

    const scanDuration = Date.now() - startTime;

    return {
      projects,
      scannedDirectories: 1,
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