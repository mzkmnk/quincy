/**
 * Amazon Q CLI historyデータの型定義
 * anyを使わない厳密な型定義
 */

// 環境状態の型定義
export interface EnvironmentState {
  operating_system: string;
  current_working_directory: string;
  environment_variables: string[];
}

// 環境コンテキストの型定義
export interface EnvironmentContext {
  env_state: EnvironmentState;
}

// ツール使用結果の型定義
export interface ToolUseResult {
  tool_use_id: string;
  content: Array<{
    Json?: {
      content: Array<{
        text: string;
        type: string;
      }>;
    };
    Text?: string;
  }>;
  status: 'Success' | 'Error';
}

// ツール使用の型定義
export interface ToolUse {
  id: string;
  name: string;
  orig_name: string;
  args: Record<string, string | number | boolean>;
  orig_args: Record<string, string | number | boolean>;
}

// 入力メッセージの内容の型定義
export type HistoryInputContent = 
  | { Prompt: { prompt: string } }
  | { ToolUseResults: { tool_use_results: ToolUseResult[] } }
  | { CancelledToolUses: { prompt: string; tool_use_results: ToolUseResult[] } };

// 応答メッセージの内容の型定義
export type HistoryResponseContent = 
  | { ToolUse: { message_id: string; content: string; tool_uses: ToolUse[] } }
  | { Response: { message_id: string; content: string } };

// 入力メッセージの型定義
export interface HistoryInputMessage {
  additional_context: string;
  env_context: EnvironmentContext;
  content: HistoryInputContent;
  images: string[] | null;
}

// 応答メッセージの型定義
export type HistoryResponseMessage = HistoryResponseContent;

// 履歴エントリの型定義（必ず[入力, 応答]のペア）
export type HistoryEntry = [HistoryInputMessage, HistoryResponseMessage];

// 完全な履歴データの型定義
export interface HistoryData {
  history: HistoryEntry[];
}

// 会話ターンの型定義（Response までの一連の流れ）
export interface ConversationTurn {
  userMessage: string;
  aiThinking: string[];  // ToolUse の連続
  aiResponse: string;    // 最終的な Response
  metadata: {
    environmentInfo: EnvironmentState;
    toolsUsed: ToolUse[];
    messageIds: string[];
    turnStartIndex: number;
    turnEndIndex: number;
  };
}

// UI表示用のメッセージの型定義
export interface DisplayMessage {
  id: string;
  type: 'user' | 'assistant' | 'thinking';
  content: string;
  timestamp?: Date;
  metadata?: {
    environmentInfo?: EnvironmentState;
    toolsUsed?: ToolUse[];
    messageId?: string;
  };
}

// 型ガード関数
export function isPromptMessage(content: HistoryInputContent): content is { Prompt: { prompt: string } } {
  return 'Prompt' in content;
}

export function isToolUseResultsMessage(content: HistoryInputContent): content is { ToolUseResults: { tool_use_results: ToolUseResult[] } } {
  return 'ToolUseResults' in content;
}

export function isCancelledToolUsesMessage(content: HistoryInputContent): content is { CancelledToolUses: { prompt: string; tool_use_results: ToolUseResult[] } } {
  return 'CancelledToolUses' in content;
}

export function isToolUseResponse(content: HistoryResponseContent): content is { ToolUse: { message_id: string; content: string; tool_uses: ToolUse[] } } {
  return 'ToolUse' in content;
}

export function isResponse(content: HistoryResponseContent): content is { Response: { message_id: string; content: string } } {
  return 'Response' in content;
}

// 拡張された AmazonQConversation 型定義
export interface AmazonQConversationWithHistory {
  conversation_id: string;
  model: string;
  history?: HistoryData;
  tools: string[];
  context_manager: Record<string, unknown>;
  latest_summary: string | null;
}