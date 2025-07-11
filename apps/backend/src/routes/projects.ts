import { Hono } from 'hono';
import type { 
  Project, 
  ProjectCreateRequest, 
  ProjectUpdateRequest,
  ProjectScanResult 
} from '@quincy/shared';
import { ProjectManager } from '../services/project-manager';
import { ProjectDetectionService } from '../services/project-detection';
import { WebSocketService } from '../services/websocket';

const projects = new Hono();

// サービスのインスタンスを作成
const projectDetection = new ProjectDetectionService();
const projectManager = new ProjectManager(projectDetection);

// WebSocketサービスのインスタンスは後で注入される
let webSocketService: WebSocketService | null = null;

export function setWebSocketService(ws: WebSocketService) {
  webSocketService = ws;
}

// プロジェクト一覧取得
projects.get('/', async (c) => {
  try {
    const projectList = await projectManager.getProjects();
    return c.json(projectList);
  } catch (error) {
    console.error('Failed to get projects:', error);
    return c.json({ error: 'Failed to get projects' }, 500);
  }
});

// 特定のプロジェクト取得
projects.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const project = await projectManager.getProject(id);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }

    // 最終アクセス時間を更新
    await projectManager.updateLastAccessed(id);
    
    return c.json(project);
  } catch (error) {
    console.error('Failed to get project:', error);
    return c.json({ error: 'Failed to get project' }, 500);
  }
});

// 新しいプロジェクト作成
projects.post('/', async (c) => {
  try {
    const createRequest: ProjectCreateRequest = await c.req.json();
    
    // バリデーション
    if (!createRequest.name || !createRequest.path) {
      return c.json({ error: 'Name and path are required' }, 400);
    }

    const project = await projectManager.createProject(createRequest);
    
    // WebSocket経由で通知
    if (webSocketService) {
      webSocketService.broadcastToAll('project:created', { project });
    }
    
    return c.json(project, 201);
  } catch (error) {
    console.error('Failed to create project:', error);
    
    if (error instanceof Error && error.message.includes('already exists')) {
      return c.json({ error: error.message }, 409);
    }
    
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// プロジェクト更新
projects.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const updateRequest: ProjectUpdateRequest = await c.req.json();
    
    const project = await projectManager.updateProject(id, updateRequest);
    
    // WebSocket経由で通知
    if (webSocketService) {
      webSocketService.broadcastToAll('project:updated', { project });
    }
    
    return c.json(project);
  } catch (error) {
    console.error('Failed to update project:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// プロジェクト削除
projects.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    await projectManager.deleteProject(id);
    
    // WebSocket経由で通知
    if (webSocketService) {
      webSocketService.broadcastToAll('project:deleted', { projectId: id });
    }
    
    return c.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Failed to delete project:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    
    if (error instanceof Error && error.message.includes('Cannot delete detected project')) {
      return c.json({ error: error.message }, 403);
    }
    
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// プロジェクトスキャン実行
projects.post('/scan', async (c) => {
  try {
    const result: ProjectScanResult = await projectManager.scanProjects();
    
    // WebSocket経由で通知
    if (webSocketService) {
      webSocketService.broadcastToAll('projects:scanned', { result });
    }
    
    return c.json(result);
  } catch (error) {
    console.error('Failed to scan projects:', error);
    return c.json({ error: 'Failed to scan projects' }, 500);
  }
});

// プロジェクトのメタデータリフレッシュ
projects.post('/:id/refresh', async (c) => {
  try {
    const id = c.req.param('id');
    
    const project = await projectManager.refreshProject(id);
    
    // WebSocket経由で通知
    if (webSocketService) {
      webSocketService.broadcastToAll('project:updated', { project });
    }
    
    return c.json(project);
  } catch (error) {
    console.error('Failed to refresh project:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: 'Failed to refresh project' }, 500);
  }
});

// プロジェクトキャッシュクリア（開発/デバッグ用）
projects.delete('/cache/clear', async (c) => {
  try {
    await projectManager.clearCache();
    return c.json({ message: 'Project cache cleared successfully' });
  } catch (error) {
    console.error('Failed to clear project cache:', error);
    return c.json({ error: 'Failed to clear project cache' }, 500);
  }
});

export { projects };