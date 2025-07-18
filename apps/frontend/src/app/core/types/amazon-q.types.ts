/**
 * Amazon Q関連の型定義
 */

import { SessionId, MessageId, ConversationId, ProjectId, Timestamp } from './common.types';

// Amazon Qメッセージ送信者
export type AmazonQMessageSender = 'user' | 'assistant';

// Amazon Qメッセージ状態
export type AmazonQMessageStatus = 'pending' | 'streaming' | 'completed' | 'error';

// Amazon Qセッション状態
export type AmazonQSessionStatus = 'initializing' | 'active' | 'paused' | 'completed' | 'error';

// Amazon Qメッセージ型
export interface AmazonQMessage {
  id: MessageId;
  sessionId: SessionId;
  conversationId?: ConversationId;
  content: string;
  sender: AmazonQMessageSender;
  timestamp: Timestamp;
  status?: AmazonQMessageStatus;
  isTyping?: boolean;
  isStreaming?: boolean;
  tokens?: number;
  toolUses?: string[];
  error?: string;
}

// Amazon Qセッション型
export interface AmazonQSession {
  sessionId: SessionId;
  projectId: ProjectId;
  projectPath: string;
  projectName: string;
  status: AmazonQSessionStatus;
  startedAt: Timestamp;
  lastActivity: Timestamp;
  endedAt?: Timestamp;
  totalMessages: number;
  totalTokens: number;
  error?: string;
}

// Amazon Q会話履歴型
export interface AmazonQConversation {
  conversation_id: ConversationId;
  title: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  message_count: number;
  total_turns: number;
  average_tool_uses_per_turn: number;
  total_tool_uses: number;
  projectPath?: string;
  projectName?: string;
}

// Amazon Q会話メタデータ型
export interface AmazonQConversationMetadata {
  conversation_id: ConversationId;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  total_turns: number;
  average_tool_uses_per_turn: number;
  total_tool_uses: number;
  projectPath: string;
  projectName?: string;
}

// Amazon Q詳細履歴メッセージ型
export interface AmazonQDetailedHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Timestamp;
  tool_uses?: string[];
  turn_number?: number;
}

// Amazon Q履歴統計型
export interface AmazonQHistoryStats {
  totalEntries: number;
  totalTurns: number;
  averageToolUsesPerTurn: number;
  totalToolUses: number;
  oldestConversation?: Timestamp;
  newestConversation?: Timestamp;
}

// Amazon Qプロジェクト履歴型
export interface AmazonQProjectHistory {
  projectPath: string;
  projectName: string;
  conversations: AmazonQConversationMetadata[];
  stats: AmazonQHistoryStats;
  lastUpdated: Timestamp;
}

// Amazon Qセッション開始イベント型
export interface QSessionStartedEvent {
  sessionId: SessionId;
  projectPath: string;
  projectName: string;
  timestamp: Timestamp;
}

// Amazon Qセッション終了イベント型
export interface QSessionEndedEvent {
  sessionId: SessionId;
  endedAt: Timestamp;
  totalMessages: number;
  totalTokens: number;
  reason: 'completed' | 'timeout' | 'error' | 'user_ended';
  error?: string;
}

// Amazon Qエラー型
export interface AmazonQError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  sessionId?: SessionId;
  timestamp: Timestamp;
}

// 型ガード関数
export function isAmazonQMessage(data: unknown): data is AmazonQMessage {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'sessionId' in data && 
         'content' in data && 
         'sender' in data && 
         'timestamp' in data;
}

export function isAmazonQSession(data: unknown): data is AmazonQSession {
  return typeof data === 'object' && 
         data !== null && 
         'sessionId' in data && 
         'projectPath' in data && 
         'status' in data;
}

export function isAmazonQConversation(data: unknown): data is AmazonQConversation {
  return typeof data === 'object' && 
         data !== null && 
         'conversation_id' in data && 
         'title' in data && 
         'created_at' in data;
}

export function isUserMessage(message: AmazonQMessage): boolean {
  return message.sender === 'user';
}

export function isAssistantMessage(message: AmazonQMessage): boolean {
  return message.sender === 'assistant';
}

export function isStreamingMessage(message: AmazonQMessage): boolean {
  return message.isStreaming === true || message.status === 'streaming';
}

export function isCompletedMessage(message: AmazonQMessage): boolean {
  return message.status === 'completed';
}

export function isErrorMessage(message: AmazonQMessage): boolean {
  return message.status === 'error' || Boolean(message.error);
}