import type { Server } from 'socket.io';

import type { DatabaseChangeEvent } from '../../../types/database-watcher';

export function handleDatabaseChangeNotification(
  io: Server | null,
  changeData: DatabaseChangeEvent
): void {
  if (!io || !changeData) {
    return;
  }

  try {
    io.emit('database-changed', changeData);
  } catch (error) {
    console.error('Error emitting database change notification:', error);
  }
}
