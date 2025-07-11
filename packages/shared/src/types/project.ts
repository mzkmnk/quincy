/**
 * プロジェクト関連の型定義
 */

export interface ProjectMetadata {
  /** package.jsonから抽出されたメタデータ */
  packageJson?: {
    name?: string;
    version?: string;
    description?: string;
    author?: string;
    license?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
  };
  /** プロジェクトの種類 */
  type?: 'nodejs' | 'angular' | 'react' | 'vue' | 'unknown';
  /** 言語情報 */
  languages?: string[];
  /** ファイル統計 */
  fileStats?: {
    totalFiles: number;
    totalSize: number;
    lastModified: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  /** プロジェクトのフルパス */
  path: string;
  /** 手動で追加されたプロジェクトかどうか */
  isManual: boolean;
  /** プロジェクトメタデータ */
  metadata?: ProjectMetadata;
  /** 作成日時 */
  createdAt: number;
  /** 最終更新日時 */
  updatedAt: number;
  /** 最後にアクセスした日時 */
  lastAccessedAt?: number;
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

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  path: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
}

export type ProjectEvent = 
  | { type: 'project:created'; project: Project }
  | { type: 'project:updated'; project: Project }
  | { type: 'project:deleted'; projectId: string }
  | { type: 'projects:scanned'; result: ProjectScanResult };