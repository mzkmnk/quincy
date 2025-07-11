import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Project, ProjectScanResult } from '@quincy/shared';
import { ProjectDetectionService } from '../services/project-detection';

describe('ProjectDetectionService', () => {
  let tempDir: string;
  let projectDetection: ProjectDetectionService;

  beforeEach(async () => {
    // テスト用の一時ディレクトリを作成
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quincy-test-'));
    projectDetection = new ProjectDetectionService();
  });

  afterEach(async () => {
    // テスト後のクリーンアップ
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('scanForProjects', () => {
    it('空のディレクトリをスキャンすると空の結果を返す', async () => {
      const result = await projectDetection.scanForProjects(tempDir);
      
      expect(result).toEqual({
        projects: [],
        scannedDirectories: 0,
        errors: [],
        scanDuration: expect.any(Number)
      });
    });

    it('package.jsonを持つディレクトリをプロジェクトとして検出する', async () => {
      // テスト用のプロジェクトディレクトリを作成
      const projectDir = path.join(tempDir, 'test-project');
      await fs.mkdir(projectDir);
      
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        description: 'Test project for quincy',
        author: 'Test Author',
        dependencies: {
          'react': '^18.0.0'
        }
      };
      
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await projectDetection.scanForProjects(tempDir);
      
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0]).toMatchObject({
        name: 'test-project',
        path: projectDir,
        isManual: false,
        metadata: {
          packageJson: packageJson,
          type: 'nodejs'
        }
      });
      expect(result.scannedDirectories).toBeGreaterThan(0);
      expect(result.errors).toEqual([]);
    });

    it('Angularプロジェクトを正しく検出する', async () => {
      const projectDir = path.join(tempDir, 'angular-project');
      await fs.mkdir(projectDir);
      
      const packageJson = {
        name: 'angular-project',
        version: '1.0.0',
        dependencies: {
          '@angular/core': '^17.0.0',
          '@angular/cli': '^17.0.0'
        }
      };
      
      const angularJson = {
        version: 1,
        projects: {
          'angular-project': {
            projectType: 'application'
          }
        }
      };
      
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
      
      await fs.writeFile(
        path.join(projectDir, 'angular.json'),
        JSON.stringify(angularJson, null, 2)
      );

      const result = await projectDetection.scanForProjects(tempDir);
      
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].metadata?.type).toBe('angular');
    });

    it('複数のプロジェクトを検出する', async () => {
      // プロジェクト1
      const project1Dir = path.join(tempDir, 'project1');
      await fs.mkdir(project1Dir);
      await fs.writeFile(
        path.join(project1Dir, 'package.json'),
        JSON.stringify({ name: 'project1', version: '1.0.0' }, null, 2)
      );

      // プロジェクト2
      const project2Dir = path.join(tempDir, 'project2');
      await fs.mkdir(project2Dir);
      await fs.writeFile(
        path.join(project2Dir, 'package.json'),
        JSON.stringify({ name: 'project2', version: '2.0.0' }, null, 2)
      );

      const result = await projectDetection.scanForProjects(tempDir);
      
      expect(result.projects).toHaveLength(2);
      expect(result.projects.map(p => p.name)).toEqual(
        expect.arrayContaining(['project1', 'project2'])
      );
    });

    it('アクセス権限のないディレクトリをスキップしてエラーを記録する', async () => {
      const restrictedDir = path.join(tempDir, 'restricted');
      await fs.mkdir(restrictedDir);
      
      // 権限を削除
      await fs.chmod(restrictedDir, 0o000);

      const result = await projectDetection.scanForProjects(tempDir);
      
      // エラーが記録されるが、処理は継続される
      expect(result.errors.length).toBeGreaterThan(0);
      
      // 権限を戻してクリーンアップできるようにする
      await fs.chmod(restrictedDir, 0o755);
    });
  });

  describe('extractMetadata', () => {
    it('package.jsonからメタデータを抽出する', async () => {
      const projectDir = path.join(tempDir, 'metadata-test');
      await fs.mkdir(projectDir);
      
      const packageJson = {
        name: 'metadata-test',
        version: '1.0.0',
        description: 'Test project',
        author: 'Test Author',
        license: 'MIT',
        dependencies: {
          'react': '^18.0.0',
          'typescript': '^5.0.0'
        },
        devDependencies: {
          'vitest': '^1.0.0'
        },
        scripts: {
          'start': 'react-scripts start',
          'build': 'react-scripts build',
          'test': 'vitest'
        }
      };
      
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const metadata = await projectDetection.extractMetadata(projectDir);
      
      expect(metadata.packageJson).toEqual(packageJson);
      expect(metadata.type).toBe('react');
      expect(metadata.languages).toContain('typescript');
      expect(metadata.fileStats).toMatchObject({
        totalFiles: expect.any(Number),
        totalSize: expect.any(Number),
        lastModified: expect.any(Number)
      });
    });

    it('package.jsonが存在しない場合のメタデータ抽出', async () => {
      const projectDir = path.join(tempDir, 'no-package');
      await fs.mkdir(projectDir);
      
      // ファイルを作成してプロジェクトっぽくする
      await fs.writeFile(path.join(projectDir, 'index.js'), 'console.log("test");');

      const metadata = await projectDetection.extractMetadata(projectDir);
      
      expect(metadata.packageJson).toBeUndefined();
      expect(metadata.type).toBe('unknown');
      expect(metadata.fileStats).toMatchObject({
        totalFiles: expect.any(Number),
        totalSize: expect.any(Number),
        lastModified: expect.any(Number)
      });
    });
  });

  describe('detectProjectType', () => {
    it('Reactプロジェクトを検出する', () => {
      const packageJson = {
        dependencies: {
          'react': '^18.0.0'
        }
      };
      
      const type = projectDetection.detectProjectType(packageJson);
      expect(type).toBe('react');
    });

    it('Angularプロジェクトを検出する', () => {
      const packageJson = {
        dependencies: {
          '@angular/core': '^17.0.0'
        }
      };
      
      const type = projectDetection.detectProjectType(packageJson);
      expect(type).toBe('angular');
    });

    it('Vueプロジェクトを検出する', () => {
      const packageJson = {
        dependencies: {
          'vue': '^3.0.0'
        }
      };
      
      const type = projectDetection.detectProjectType(packageJson);
      expect(type).toBe('vue');
    });

    it('Node.jsプロジェクトを検出する', () => {
      const packageJson = {
        dependencies: {
          'express': '^4.0.0'
        }
      };
      
      const type = projectDetection.detectProjectType(packageJson);
      expect(type).toBe('nodejs');
    });

    it('依存関係がない場合はunknownを返す', () => {
      const packageJson = {};
      
      const type = projectDetection.detectProjectType(packageJson);
      expect(type).toBe('unknown');
    });
  });
});