import { promises as fs } from 'fs';

import type { DatabaseChangeEvent, WebSocketEmitFunction } from '../../../types/database-watcher';

export async function handleDatabaseChange(
  filePath: string,
  emitFn: WebSocketEmitFunction
): Promise<boolean> {
  try {
    // ファイルの存在確認
    await fs.access(filePath);

    const eventData: DatabaseChangeEvent = {
      filePath,
      timestamp: new Date(),
      changeType: 'modified',
    };

    emitFn('database-changed', eventData);
    return true;
  } catch (error) {
    console.error('Error handling database change:', error);
    return false;
  }
}
