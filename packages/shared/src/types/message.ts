/**
 * メッセージ関連の型定義
 */

export interface Message {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: MessageMetadata;
}

export type MessageRole = 'user' | 'assistant' | 'system' | 'error';

export interface MessageMetadata {
  model?: string;
  tokensUsed?: number;
  processingTime?: number;
  toolsUsed?: string[];
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  type: 'file' | 'image' | 'code';
  name: string;
  content: string;
  mimeType?: string;
}