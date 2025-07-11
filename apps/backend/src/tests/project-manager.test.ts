import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { Project, ProjectCreateRequest, ProjectUpdateRequest } from '@quincy/shared';
import { ProjectManager } from '../services/project-manager';
import { ProjectDetectionService } from '../services/project-detection';

describe('ProjectManager', () => {
  let tempDir: string;
  let projectManager: ProjectManager;
  let projectDetection: ProjectDetectionService;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'quincy-project-manager-test-'));
    projectDetection = new ProjectDetectionService();
    projectManager = new ProjectManager(projectDetection, tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('scanProjects', () => {
    it('プロジェクトスキャンとキャッシュを実行する', async () => {
      // テスト用プロジェクトを作成
      const projectDir = path.join(tempDir, 'test-project');
      await fs.mkdir(projectDir);
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'test-project', version: '1.0.0' }, null, 2)
      );

      const result = await projectManager.scanProjects();
      
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe('test-project');
      expect(result.scannedDirectories).toBeGreaterThan(0);
      
      // キャッシュされたプロジェクトを確認
      const cachedProjects = await projectManager.getProjects();
      expect(cachedProjects).toHaveLength(1);
      expect(cachedProjects[0].name).toBe('test-project');
    });

    it('スキャン後にプロジェクトキャッシュが更新される', async () => {
      // 最初は空
      const initialProjects = await projectManager.getProjects();
      expect(initialProjects).toHaveLength(0);

      // プロジェクトを作成
      const projectDir = path.join(tempDir, 'new-project');
      await fs.mkdir(projectDir);
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'new-project', version: '1.0.0' }, null, 2)
      );

      // スキャンを実行
      await projectManager.scanProjects();

      // キャッシュが更新されている
      const projects = await projectManager.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].name).toBe('new-project');
    });
  });

  describe('getProjects', () => {
    it('初期状態では空の配列を返す', async () => {
      const projects = await projectManager.getProjects();
      expect(projects).toEqual([]);
    });

    it('キャッシュされたプロジェクトを返す', async () => {
      // プロジェクトを手動で追加
      const createRequest: ProjectCreateRequest = {
        name: 'manual-project',
        description: 'Manually added project',
        path: '/tmp/manual-project'
      };
      
      const project = await projectManager.createProject(createRequest);
      
      const projects = await projectManager.getProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0]).toEqual(project);
    });
  });

  describe('getProject', () => {
    it('存在するプロジェクトを取得する', async () => {
      const createRequest: ProjectCreateRequest = {
        name: 'test-project',
        description: 'Test project',
        path: '/tmp/test-project'
      };
      
      const createdProject = await projectManager.createProject(createRequest);
      const retrievedProject = await projectManager.getProject(createdProject.id);
      
      expect(retrievedProject).toEqual(createdProject);
    });

    it('存在しないプロジェクトに対してnullを返す', async () => {
      const project = await projectManager.getProject('non-existent-id');
      expect(project).toBeNull();
    });
  });

  describe('createProject', () => {
    it('手動プロジェクトを作成する', async () => {
      const createRequest: ProjectCreateRequest = {
        name: 'manual-project',
        description: 'Manually created project',
        path: '/tmp/manual-project'
      };
      
      const project = await projectManager.createProject(createRequest);
      
      expect(project).toMatchObject({
        name: 'manual-project',
        description: 'Manually created project',
        path: '/tmp/manual-project',
        isManual: true,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number)
      });
      expect(project.id).toBeDefined();
    });

    it('既存のパスでプロジェクト作成時にエラーを投げる', async () => {
      const createRequest: ProjectCreateRequest = {
        name: 'project1',
        path: '/tmp/same-path'
      };
      
      await projectManager.createProject(createRequest);
      
      const duplicateRequest: ProjectCreateRequest = {
        name: 'project2',
        path: '/tmp/same-path'
      };
      
      await expect(projectManager.createProject(duplicateRequest))
        .rejects.toThrow('Project with path /tmp/same-path already exists');
    });

    it('空の名前でプロジェクト作成時にエラーを投げる', async () => {
      const createRequest: ProjectCreateRequest = {
        name: '',
        path: '/tmp/empty-name'
      };
      
      await expect(projectManager.createProject(createRequest))
        .rejects.toThrow('Project name cannot be empty');
    });
  });

  describe('updateProject', () => {
    it('プロジェクトを更新する', async () => {
      const createRequest: ProjectCreateRequest = {
        name: 'original-name',
        description: 'Original description',
        path: '/tmp/update-test'
      };
      
      const project = await projectManager.createProject(createRequest);
      
      const updateRequest: ProjectUpdateRequest = {
        name: 'updated-name',
        description: 'Updated description'
      };
      
      const updatedProject = await projectManager.updateProject(project.id, updateRequest);
      
      expect(updatedProject.name).toBe('updated-name');
      expect(updatedProject.description).toBe('Updated description');
      expect(updatedProject.updatedAt).toBeGreaterThan(project.updatedAt);
    });

    it('存在しないプロジェクトの更新でエラーを投げる', async () => {
      const updateRequest: ProjectUpdateRequest = {
        name: 'updated-name'
      };
      
      await expect(projectManager.updateProject('non-existent-id', updateRequest))
        .rejects.toThrow('Project with id non-existent-id not found');
    });

    it('空の名前で更新時にエラーを投げる', async () => {
      const createRequest: ProjectCreateRequest = {
        name: 'test-project',
        path: '/tmp/test'
      };
      
      const project = await projectManager.createProject(createRequest);
      
      const updateRequest: ProjectUpdateRequest = {
        name: ''
      };
      
      await expect(projectManager.updateProject(project.id, updateRequest))
        .rejects.toThrow('Project name cannot be empty');
    });
  });

  describe('deleteProject', () => {
    it('手動プロジェクトを削除する', async () => {
      const createRequest: ProjectCreateRequest = {
        name: 'delete-test',
        path: '/tmp/delete-test'
      };
      
      const project = await projectManager.createProject(createRequest);
      
      await projectManager.deleteProject(project.id);
      
      const deletedProject = await projectManager.getProject(project.id);
      expect(deletedProject).toBeNull();
    });

    it('検出されたプロジェクト（非手動）の削除を拒否する', async () => {
      // 実際のプロジェクトディレクトリを作成
      const projectDir = path.join(tempDir, 'detected-project');
      await fs.mkdir(projectDir);
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'detected-project', version: '1.0.0' }, null, 2)
      );

      // スキャンして検出されたプロジェクトを取得
      await projectManager.scanProjects();
      const projects = await projectManager.getProjects();
      const detectedProject = projects.find(p => p.name === 'detected-project')!;
      
      await expect(projectManager.deleteProject(detectedProject.id))
        .rejects.toThrow('Cannot delete detected project. Only manually added projects can be deleted.');
    });

    it('存在しないプロジェクトの削除でエラーを投げる', async () => {
      await expect(projectManager.deleteProject('non-existent-id'))
        .rejects.toThrow('Project with id non-existent-id not found');
    });
  });

  describe('refreshProject', () => {
    it('プロジェクトのメタデータを更新する', async () => {
      // 実際のプロジェクトディレクトリを作成
      const projectDir = path.join(tempDir, 'refresh-test');
      await fs.mkdir(projectDir);
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ name: 'refresh-test', version: '1.0.0' }, null, 2)
      );

      // スキャンしてプロジェクトを取得
      await projectManager.scanProjects();
      const projects = await projectManager.getProjects();
      const project = projects[0];

      // package.jsonを更新
      await fs.writeFile(
        path.join(projectDir, 'package.json'),
        JSON.stringify({ 
          name: 'refresh-test', 
          version: '2.0.0',
          description: 'Updated description'
        }, null, 2)
      );

      const refreshedProject = await projectManager.refreshProject(project.id);
      
      expect(refreshedProject.metadata?.packageJson?.version).toBe('2.0.0');
      expect(refreshedProject.metadata?.packageJson?.description).toBe('Updated description');
      expect(refreshedProject.updatedAt).toBeGreaterThan(project.updatedAt);
    });

    it('存在しないプロジェクトのリフレッシュでエラーを投げる', async () => {
      await expect(projectManager.refreshProject('non-existent-id'))
        .rejects.toThrow('Project with id non-existent-id not found');
    });
  });
});