import { Hono } from 'hono';
import type { 
  Project, 
  ProjectScanResult 
} from '@quincy/shared';
import { ProjectManager } from '../services/project-manager';
import { WebSocketService } from '../services/websocket';

const projects = new Hono();

// サービスのインスタンスを作成
const projectManager = new ProjectManager();

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
    
    return c.json(project);
  } catch (error) {
    console.error('Failed to get project:', error);
    return c.json({ error: 'Failed to get project' }, 500);
  }
});


// プロジェクトスキャン実行
projects.post('/scan', async (c) => {
  try {
    const result: ProjectScanResult = await projectManager.scanProjects();
    
    // WebSocket経由で通知
    if (webSocketService) {
      webSocketService.broadcastToAll('projects:scanned', result);
    }
    
    return c.json(result);
  } catch (error) {
    console.error('Failed to scan projects:', error);
    return c.json({ error: 'Failed to scan projects' }, 500);
  }
});


export { projects };