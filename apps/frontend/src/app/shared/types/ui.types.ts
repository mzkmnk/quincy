/**
 * UI関連の型定義
 */

import { MessageId, SessionId, ProjectId } from '../../core/types/common.types';

// UI状態の基底型
export interface BaseUIState {
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

// フォーム状態型
export interface FormState extends BaseUIState {
  valid: boolean;
  dirty: boolean;
  touched: boolean;
  validationErrors: Record<string, string>;
}

// 表示用メッセージ型
export interface DisplayMessage {
  id: MessageId;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  isTyping?: boolean;
  isStreaming?: boolean;
  error?: string;
}

// チャット状態型
export interface ChatUIState extends BaseUIState {
  messages: DisplayMessage[];
  currentMessage: string;
  isComposing: boolean;
  scrollToBottom: boolean;
  hasMoreMessages: boolean;
}

// セッション状態型
export interface SessionUIState extends BaseUIState {
  starting: boolean;
  active: boolean;
  resuming: boolean;
  currentSessionId: SessionId | null;
  sessionError: string | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
}

// プロジェクト状態型
export interface ProjectUIState extends BaseUIState {
  projects: ProjectDisplayInfo[];
  currentProject: ProjectDisplayInfo | null;
  selectedPath: string;
  pathError: string | null;
}

// プロジェクト表示情報型
export interface ProjectDisplayInfo {
  id: ProjectId;
  name: string;
  path: string;
  lastAccessed?: Date;
  isActive: boolean;
  hasHistory: boolean;
  messageCount: number;
}

// 履歴表示状態型
export interface HistoryUIState extends BaseUIState {
  conversations: ConversationDisplayInfo[];
  currentConversation: ConversationDisplayInfo | null;
  detailedMessages: DisplayMessage[];
  showStats: boolean;
  filterBy: 'all' | 'recent' | 'favorites';
  sortBy: 'date' | 'name' | 'activity';
  sortOrder: 'asc' | 'desc';
}

// 会話表示情報型
export interface ConversationDisplayInfo {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  projectName: string;
  projectPath: string;
  preview?: string;
  isFavorite?: boolean;
}

// ナビゲーション状態型
export interface NavigationUIState {
  currentRoute: string;
  sidebarOpen: boolean;
  showProjectList: boolean;
  showHistoryList: boolean;
  breadcrumbs: BreadcrumbItem[];
}

// パンくずリスト項目型
export interface BreadcrumbItem {
  label: string;
  path: string;
  active: boolean;
}

// 通知状態型
export interface NotificationUIState {
  notifications: NotificationInfo[];
  maxNotifications: number;
  autoHideDelay: number;
}

// 通知情報型
export interface NotificationInfo {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  autoHide: boolean;
  actions?: NotificationAction[];
}

// 通知アクション型
export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

// モーダル状態型
export interface ModalUIState {
  isOpen: boolean;
  modalType: string | null;
  modalData: any;
  closable: boolean;
  backdrop: boolean;
}

// テーマ型
export type Theme = 'light' | 'dark' | 'auto';

// 言語型
export type Language = 'ja' | 'en';

// 設定状態型
export interface SettingsUIState {
  theme: Theme;
  language: Language;
  fontSize: 'small' | 'medium' | 'large';
  autoSave: boolean;
  showTimestamps: boolean;
  enableSounds: boolean;
  enableAnimations: boolean;
  maxHistoryItems: number;
}

// 全体のUI状態型
export interface AppUIState {
  chat: ChatUIState;
  session: SessionUIState;
  project: ProjectUIState;
  history: HistoryUIState;
  navigation: NavigationUIState;
  notifications: NotificationUIState;
  modal: ModalUIState;
  settings: SettingsUIState;
}

// UI状態の部分更新型
export type PartialUIState<T> = Partial<T> & Pick<T, keyof T & ('loading' | 'error')>;

// 型ガード関数
export function isDisplayMessage(data: unknown): data is DisplayMessage {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'content' in data && 
         'sender' in data && 
         'timestamp' in data;
}

export function isFormState(data: unknown): data is FormState {
  return typeof data === 'object' && 
         data !== null && 
         'valid' in data && 
         'dirty' in data && 
         'touched' in data;
}

export function isNotificationInfo(data: unknown): data is NotificationInfo {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'type' in data && 
         'title' in data && 
         'message' in data;
}

// ユーティリティ型
export type UIStateUpdater<T> = (state: T) => T;
export type UIStateSelector<T, R> = (state: T) => R;