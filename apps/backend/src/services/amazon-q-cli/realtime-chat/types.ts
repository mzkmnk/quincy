/**
 * Realtime chat related type definitions
 */

export type ChatState = 'idle' | 'thinking' | 'responding';

export interface ChatStateInfo {
  state: ChatState;
  thinkingStartTime: number;
  respondingStartTime: number;
  thinkingDuration: number;
}

export interface MessageExtractionResult {
  hasMessage: boolean;
  message: string;
  isComplete: boolean;
}

export interface ChatEventData {
  sessionId: string;
  timestamp: number;
}

export interface ChatStartEventData extends ChatEventData {
  type: 'chat-start';
}

export interface ChatMessageEventData extends ChatEventData {
  type: 'chat-message';
  content: string;
  isComplete: boolean;
}

export interface ChatCompleteEventData extends ChatEventData {
  type: 'chat-complete';
  thinkingDuration: number;
}

export interface ChatErrorEventData extends ChatEventData {
  type: 'chat-error';
  error: string;
}

export type ChatEvent =
  | ChatStartEventData
  | ChatMessageEventData
  | ChatCompleteEventData
  | ChatErrorEventData;
