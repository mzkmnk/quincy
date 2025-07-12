import { Router, Request, Response } from 'express';
import type {
  Project,
  ProjectScanResult
} from '@quincy/shared';
import { ProjectManager } from '../services/project-manager';
import { WebSocketService } from '../services/websocket';

const projects = Router();

// サービスのインスタンスを作成
const projectManager = new ProjectManager();

// WebSocketサービスのインスタンスは後で注入される
let webSocketService: WebSocketService | null = null;

export function setWebSocketService(ws: WebSocketService) {
  webSocketService = ws;
}

// プロジェクト一覧取得
projects.get('/', async (_req: Request, res: Response) => {
  try {
    const projectList = await projectManager.getProjects();
    res.json(projectList);
  } catch (error) {
    console.error('Failed to get projects:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// 特定のプロジェクト取得
projects.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const project = await projectManager.getProject(id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Failed to get project:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// プロジェクトスキャン実行
projects.post('/scan', async (_req: Request, res: Response) => {
  try {
    const result: ProjectScanResult = await projectManager.scanProjects();

    // WebSocket経由で通知
    if (webSocketService) {
      webSocketService.broadcastToAll('projects:scanned', { result });
    }

    res.json(result);
  } catch (error) {
    console.error('Failed to scan projects:', error);
    res.status(500).json({ error: 'Failed to scan projects' });
  }
});

export { projects };