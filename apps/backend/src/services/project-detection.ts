import { promises as fs } from 'fs';
import * as path from 'path';
import type { Project, ProjectScanResult } from '@quincy/shared';

export class ProjectDetectionService {
  /**
   * 指定されたディレクトリをスキャンしてプロジェクトを検出する
   */
  async scanForProjects(baseDir: string): Promise<ProjectScanResult> {
    const startTime = Date.now();
    const projects: Project[] = [];
    const errors: string[] = [];
    const scannedDirs = { count: 0 };

    try {
      await this.scanDirectory(baseDir, projects, errors, scannedDirs);
    } catch (error) {
      errors.push(`Failed to scan base directory ${baseDir}: ${error}`);
    }

    const scanDuration = Date.now() - startTime;

    return {
      projects,
      scannedDirectories: scannedDirs.count,
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

      // プロジェクトの可能性があるディレクトリかチェック
      // .gitディレクトリまたは設定ファイルの存在でプロジェクトと判定
      const hasGit = entries.some(entry => 
        entry.isDirectory() && entry.name === '.git'
      );
      const hasConfigFiles = entries.some(entry => 
        entry.isFile() && this.isProjectConfigFile(entry.name)
      );

      if (hasGit || hasConfigFiles) {
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
   * プロジェクト設定ファイルかどうかを判定
   */
  private isProjectConfigFile(fileName: string): boolean {
    const configFiles = [
      'package.json',      // Node.js
      'Cargo.toml',        // Rust
      'go.mod',            // Go
      'requirements.txt',  // Python
      'pyproject.toml',    // Python
      'pom.xml',          // Java (Maven)
      'build.gradle',     // Java (Gradle)
      'Gemfile',          // Ruby
      'composer.json',    // PHP
      'CMakeLists.txt',   // C/C++
      'Makefile',         // C/C++
      '.gitignore',       // Git
      'README.md',        // Documentation
      'README.txt'        // Documentation
    ];

    return configFiles.includes(fileName);
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
    const projectName = path.basename(projectPath);
    const now = Date.now();

    return {
      id: this.generateProjectId(projectPath),
      name: projectName,
      path: projectPath,
      isManual: false,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now
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