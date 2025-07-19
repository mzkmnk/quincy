/**
 * プロジェクト関連の型定義
 */

export interface Project {
  id: string;
  name: string;
  /** プロジェクトのフルパス */
  path: string;
  /** 手動で追加されたプロジェクトかどうか */
  isManual?: boolean;
  /** プロジェクト作成日時 */
  createdAt?: number;
  /** プロジェクト更新日時 */
  updatedAt?: number;
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
