// 既存のプロセス管理機能
export { spawnProcess } from './spawn-process';
export { killProcess } from './kill-process';
export { monitorResources } from './monitor-resources';
export { waitForProcessStart } from './wait-for-process-start';
export { startResourceMonitoring } from './start-resource-monitoring';
export { updateAllSessionResources } from './update-all-session-resources';
export { cleanupInactiveSessions } from './cleanup-inactive-sessions';
export { setupCleanupHandlers } from './setup-cleanup-handlers';
export { destroy } from './destroy';

// ===== stdio streams による確実な終了検出システム =====

// 共通の型定義
export type {
  ProcessLike,
  StreamName,
  TerminationState,
  BaseEvent,
  StreamEvent,
  ProcessExitEvent,
  ErrorEvent,
  TimeoutEvent,
  StateTransitionEvent,
  Destroyable,
  StatusProvider,
} from './types';

// stdio monitor - 個別ストリーム監視
export {
  createStdioMonitor,
  type StdioMonitor,
  type StdioMonitorOptions,
  type StdioMonitorStatus,
  type StreamEndEvent,
  type AllStreamsClosedEvent,
  type StdioTimeoutEvent,
  type StdioErrorEvent,
} from './stdio-monitor';

// termination state manager - 段階的終了状態管理
export {
  createTerminationStateManager,
  type TerminationStateManager,
  type TerminationStateManagerOptions,
  type TerminationStateInfo,
  type TerminationStateTransition,
  type FullyTerminatedEvent,
  type StateTimeoutEvent,
} from './termination-state-manager';

// enhanced process termination - 統合終了検出（メインAPI）
export {
  createEnhancedProcessTermination,
  type EnhancedProcessTermination,
  type EnhancedProcessTerminationOptions,
  type ProcessTerminationStatus,
  type ProcessExitedEvent,
  type StreamsClosedEvent,
  type StreamEndedEvent,
  type EnhancedTimeoutEvent,
  type EnhancedErrorEvent,
} from './enhanced-process-termination';
