/**
 * 統合チャット状態管理（シンプル版）
 * Amazon Q CLIの全体状態を一元管理する
 *
 * 動作フロー:
 * 1. メッセージ送信 → thinking状態 → 送信不可
 * 2. Amazon Q処理中（ツール利用含む） → thinking状態維持
 * 3. `>`プロンプト検知 → idle状態 → 送信可能
 */

import { signal, computed } from '@angular/core';

export type ChatStatus = 'idle' | 'thinking' | 'responding' | 'prompt-ready' | 'error';

interface ChatState {
  status: ChatStatus;
  streamingMessageId?: string;
  currentTools?: string[];
  sessionId?: string;
  errorMessage?: string;
}

interface ChatStateManager {
  state: typeof chatState;
  canSend: typeof canSend;
  isIdle: typeof isIdle;
  isThinking: typeof isThinking;
  isResponding: typeof isResponding;
  isPromptReady: typeof isPromptReady;
  hasError: typeof hasError;
  setStatus: typeof setStatus;
  setThinking: typeof setThinking;
  setResponding: typeof setResponding;
  setPromptReady: typeof setPromptReady;
  setIdle: typeof setIdle;
  setError: typeof setError;
  clearError: typeof clearError;
  setStreamingMessage: typeof setStreamingMessage;
  clearStreamingMessage: typeof clearStreamingMessage;
  setCurrentTools: typeof setCurrentTools;
  clearCurrentTools: typeof clearCurrentTools;
}

// チャット状態signal
const chatState = signal<ChatState>({
  status: 'idle',
});

// computed状態（シンプル版）
const canSend = computed(() => {
  const state = chatState();
  // `>`プロンプト検知までは一律で送信不可
  return state.status === 'idle';
});

const isIdle = computed(() => chatState().status === 'idle');
const isThinking = computed(() => chatState().status === 'thinking');
const isResponding = computed(() => chatState().status === 'responding');
const isPromptReady = computed(() => chatState().status === 'prompt-ready');
const hasError = computed(() => chatState().status === 'error');

// 状態更新関数
function setStatus(status: ChatStatus): void {
  chatState.update(state => ({ ...state, status }));
}

function setThinking(sessionId?: string): void {
  chatState.update(state => ({
    ...state,
    status: 'thinking',
    sessionId: sessionId || state.sessionId,
    errorMessage: undefined,
  }));
}

function setResponding(sessionId?: string, streamingMessageId?: string): void {
  chatState.update(state => ({
    ...state,
    status: 'responding',
    sessionId: sessionId || state.sessionId,
    streamingMessageId,
    errorMessage: undefined,
  }));
}

function setPromptReady(sessionId?: string): void {
  chatState.update(state => ({
    ...state,
    status: 'prompt-ready',
    sessionId: sessionId || state.sessionId,
    streamingMessageId: undefined,
    errorMessage: undefined,
  }));
}

function setIdle(): void {
  chatState.update(state => ({
    ...state,
    status: 'idle',
    streamingMessageId: undefined,
    errorMessage: undefined,
  }));
}

function setError(errorMessage: string, sessionId?: string): void {
  chatState.update(state => ({
    ...state,
    status: 'error',
    errorMessage,
    sessionId: sessionId || state.sessionId,
    streamingMessageId: undefined,
  }));
}

function clearError(): void {
  chatState.update(state => ({
    ...state,
    status: 'idle',
    errorMessage: undefined,
  }));
}

function setStreamingMessage(messageId: string): void {
  chatState.update(state => ({
    ...state,
    streamingMessageId: messageId,
  }));
}

function clearStreamingMessage(): void {
  chatState.update(state => ({
    ...state,
    streamingMessageId: undefined,
  }));
}

function setCurrentTools(tools: string[]): void {
  chatState.update(state => ({
    ...state,
    currentTools: tools,
  }));
}

function clearCurrentTools(): void {
  chatState.update(state => ({
    ...state,
    currentTools: undefined,
  }));
}

export const chatStateManager: ChatStateManager = {
  state: chatState,
  canSend,
  isIdle,
  isThinking,
  isResponding,
  isPromptReady,
  hasError,
  setStatus,
  setThinking,
  setResponding,
  setPromptReady,
  setIdle,
  setError,
  clearError,
  setStreamingMessage,
  clearStreamingMessage,
  setCurrentTools,
  clearCurrentTools,
};
