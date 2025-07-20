export interface DatabaseChangeEvent {
  filePath: string;
  timestamp: Date;
  changeType: 'add' | 'modified' | 'deleted';
}

export interface DatabaseWatcherConfig {
  enabled: boolean;
  debounceMs: number;
  ignoreInitial: boolean;
}

export interface DatabaseWatcher {
  close(): void;
  isWatching(): boolean;
}

export type DatabaseChangeHandler = (filePath: string) => void | Promise<void>;

export type WebSocketEmitFunction = (event: string, data: unknown) => void;
