/**
 * Stream handler related type definitions
 */

export interface StreamHandlerCallbacks {
  onThinkingStart: (data: ThinkingStartData) => void;
  onThinkingUpdate: (data: ThinkingUpdateData) => void;
  onThinkingEnd: (data: ThinkingEndData) => void;
  onChatMessage: (data: ChatMessageData) => void;
  onPromptReady: (data: PromptReadyData) => void;
  onOutput: (data: OutputData) => void;
}

export interface ThinkingStartData {
  spinner: string;
  timestamp: number;
}

export interface ThinkingUpdateData {
  spinner: string;
  timestamp: number;
}

export interface ThinkingEndData {
  timestamp: number;
}

export interface ChatMessageData {
  content: string;
  timestamp: number;
}

export interface PromptReadyData {
  timestamp: number;
}

export interface OutputData {
  content: string;
  timestamp: number;
}

export interface PromptDetectionResult {
  hasPrompt: boolean;
  promptIndex: number;
  afterPrompt: string;
}

export interface ThinkingDetectionResult {
  isThinking: boolean;
  spinner: string;
}

export type HandlerState = 'idle' | 'thinking' | 'responding';

export interface AnsiSegment {
  text: string;
  ansiCode: string;
}

export interface ColorInfo {
  type: 'foreground' | 'background';
  colorIndex: number;
  colorName: string;
}
