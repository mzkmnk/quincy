/**
 * プロジェクト関連の型定義
 */

export interface Project {
  id: string;
  name: string;
  /** プロジェクトのフルパス */
  path: string;
}

export interface ProjectScanResult {
  /** 発見されたプロジェクト */
  projects: Project[];
  /** スキャンしたディレクトリ数 */
  scannedDirectories: number;
  /** 発生したエラー */
  errors: string[];
  /** スキャン実行時間（ミリ秒） */
  scanDuration: number;
}


export type ProjectEvent = 
  | { type: 'project:created'; project: Project }
  | { type: 'project:updated'; project: Project }
  | { type: 'project:deleted'; projectId: string }
  | { type: 'projects:scanned'; result: ProjectScanResult };