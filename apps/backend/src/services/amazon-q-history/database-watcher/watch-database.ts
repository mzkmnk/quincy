import chokidar from 'chokidar';

import type { DatabaseWatcher, DatabaseChangeHandler } from '../../../types/database-watcher';

export function watchDatabase(
  filePath: string,
  changeHandler: DatabaseChangeHandler
): DatabaseWatcher {
  let isWatchingFile = false;
  let debounceTimer: NodeJS.Timeout | null = null;

  const watcher = chokidar.watch(filePath, {
    ignoreInitial: true,
    persistent: true,
    usePolling: true, // テスト環境での安定性のためpollingを使用
    interval: 100, // polling間隔
    awaitWriteFinish: {
      stabilityThreshold: 50,
      pollInterval: 25,
    },
  });

  const debouncedHandler = (eventPath: string) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
      try {
        await changeHandler(eventPath);
      } catch (error) {
        console.error('Error in database change handler:', error);
      }
    }, 200); // デバウンス時間を短縮してテストを高速化
  };

  watcher.on('ready', () => {
    isWatchingFile = true;
  });

  watcher.on('change', debouncedHandler);
  watcher.on('add', debouncedHandler);
  watcher.on('unlink', debouncedHandler);

  watcher.on('error', error => {
    console.error('Database watcher error:', error);
    isWatchingFile = false;
  });

  return {
    close: () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }
      watcher.close();
      isWatchingFile = false;
    },
    isWatching: () => isWatchingFile,
  };
}
