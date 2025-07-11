import { promises as fs } from 'fs';
import * as path from 'path';
import type { Project, ProjectMetadata, ProjectScanResult } from '@quincy/shared';

export class ProjectDetectionService {
  /**
   * 指定されたディレクトリをスキャンしてプロジェクトを検出する
   */
  async scanForProjects(baseDir: string): Promise<ProjectScanResult> {
    const startTime = Date.now();
    const projects: Project[] = [];
    const errors: string[] = [];
    let scannedDirectories = 0;

    try {
      await this.scanDirectory(baseDir, projects, errors, scannedDirectories);
    } catch (error) {
      errors.push(`Failed to scan base directory ${baseDir}: ${error}`);
    }

    const scanDuration = Date.now() - startTime;

    return {
      projects,
      scannedDirectories,
      errors,
      scanDuration
    };
  }

  /**
   * 再帰的にディレクトリをスキャンしてプロジェクトを検出
   */
  private async scanDirectory(
    dir: string, 
    projects: Project[], 
    errors: string[], 
    scannedDirs: { count: number } = { count: 0 }
  ): Promise<void> {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      scannedDirs.count++;

      // package.jsonがあるかチェック
      const hasPackageJson = entries.some(entry => 
        entry.isFile() && entry.name === 'package.json'
      );

      if (hasPackageJson) {
        try {
          const project = await this.createProjectFromDirectory(dir);
          projects.push(project);
        } catch (error) {
          errors.push(`Failed to create project from ${dir}: ${error}`);
        }
      }

      // サブディレクトリを再帰的にスキャン（node_modules等は除外）
      for (const entry of entries) {
        if (entry.isDirectory() && !this.shouldSkipDirectory(entry.name)) {
          const subDir = path.join(dir, entry.name);
          await this.scanDirectory(subDir, projects, errors, scannedDirs);
        }
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'EACCES') {
        errors.push(`Permission denied: ${dir}`);
      } else {
        errors.push(`Failed to read directory ${dir}: ${error}`);
      }
    }
  }

  /**
   * スキップすべきディレクトリかどうかを判定
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirectories = [
      'node_modules',
      '.git',
      '.svn',
      '.hg',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'tmp',
      'temp',
      '.DS_Store',
      'Thumbs.db'
    ];

    return skipDirectories.includes(dirName) || dirName.startsWith('.');
  }

  /**
   * ディレクトリからプロジェクトを作成
   */
  private async createProjectFromDirectory(projectPath: string): Promise<Project> {
    const metadata = await this.extractMetadata(projectPath);
    const projectName = metadata.packageJson?.name || path.basename(projectPath);
    const now = Date.now();

    return {
      id: this.generateProjectId(projectPath),
      name: projectName,
      description: metadata.packageJson?.description,
      path: projectPath,
      isManual: false,
      metadata,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now
    };
  }

  /**
   * プロジェクトディレクトリからメタデータを抽出
   */
  async extractMetadata(projectPath: string): Promise<ProjectMetadata> {
    const metadata: ProjectMetadata = {};

    try {
      // package.jsonを読み込み
      const packageJsonPath = path.join(projectPath, 'package.json');
      try {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        metadata.packageJson = JSON.parse(packageJsonContent);
      } catch {
        // package.jsonが存在しない場合はスキップ
      }

      // プロジェクトタイプを検出
      metadata.type = this.detectProjectType(metadata.packageJson || {});

      // 言語情報を検出
      metadata.languages = await this.detectLanguages(projectPath);

      // ファイル統計を取得
      metadata.fileStats = await this.getFileStats(projectPath);

    } catch (error) {
      // メタデータ抽出でエラーが発生してもプロジェクト自体は有効
      console.warn(`Failed to extract metadata for ${projectPath}:`, error);
    }

    return metadata;
  }

  /**
   * package.jsonの依存関係からプロジェクトタイプを検出
   */
  detectProjectType(packageJson: Record<string, any>): 'nodejs' | 'angular' | 'react' | 'vue' | 'unknown' {
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    if (dependencies['@angular/core'] || dependencies['@angular/cli']) {
      return 'angular';
    }

    if (dependencies['react'] || dependencies['react-dom']) {
      return 'react';
    }

    if (dependencies['vue'] || dependencies['@vue/cli']) {
      return 'vue';
    }

    if (Object.keys(dependencies).length > 0) {
      return 'nodejs';
    }

    return 'unknown';
  }

  /**
   * プロジェクトディレクトリから使用言語を検出
   */
  private async detectLanguages(projectPath: string): Promise<string[]> {
    const languages = new Set<string>();

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          
          switch (ext) {
            case '.ts':
            case '.tsx':
              languages.add('typescript');
              break;
            case '.js':
            case '.jsx':
              languages.add('javascript');
              break;
            case '.py':
              languages.add('python');
              break;
            case '.java':
              languages.add('java');
              break;
            case '.go':
              languages.add('go');
              break;
            case '.rs':
              languages.add('rust');
              break;
            case '.php':
              languages.add('php');
              break;
            case '.rb':
              languages.add('ruby');
              break;
            case '.swift':
              languages.add('swift');
              break;
            case '.kt':
              languages.add('kotlin');
              break;
          }
        }
      }
    } catch (error) {
      // 言語検出でエラーが発生してもメタデータの他の部分は有効
      console.warn(`Failed to detect languages for ${projectPath}:`, error);
    }

    return Array.from(languages);
  }

  /**
   * ディレクトリのファイル統計を取得
   */
  private async getFileStats(projectPath: string): Promise<{
    totalFiles: number;
    totalSize: number;
    lastModified: number;
  }> {
    let totalFiles = 0;
    let totalSize = 0;
    let lastModified = 0;

    try {
      const entries = await fs.readdir(projectPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile()) {
          try {
            const filePath = path.join(projectPath, entry.name);
            const stats = await fs.stat(filePath);
            
            totalFiles++;
            totalSize += stats.size;
            lastModified = Math.max(lastModified, stats.mtime.getTime());
          } catch {
            // 個別のファイル統計取得エラーはスキップ
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to get file stats for ${projectPath}:`, error);
    }

    return {
      totalFiles,
      totalSize,
      lastModified: lastModified || Date.now()
    };
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