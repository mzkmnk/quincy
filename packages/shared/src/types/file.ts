/**
 * ファイル管理関連の型定義
 */

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: string;
  children?: FileNode[];
  mimeType?: string;
}

export interface FileContent {
  path: string;
  content: string;
  encoding: string;
  size: number;
  modifiedAt: string;
}

export interface SaveFileRequest {
  path: string;
  content: string;
  encoding?: string;
}

export interface FileTreeResponse {
  root: FileNode;
  totalFiles: number;
  totalDirectories: number;
}