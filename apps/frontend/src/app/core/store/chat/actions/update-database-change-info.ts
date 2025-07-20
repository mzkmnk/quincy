/**
 * データベース変更情報を更新するアクション
 */

import { chatState } from '../chat.state';

interface UpdateDatabaseChangeInfoPayload {
  filePath: string;
  changeType: 'add' | 'modified' | 'deleted';
  timestamp: Date;
}

export function updateDatabaseChangeInfo(payload: UpdateDatabaseChangeInfoPayload): void {
  chatState.update(state => ({
    ...state,
    databaseChangeInfo: {
      filePath: payload.filePath,
      changeType: payload.changeType,
      lastChange: payload.timestamp,
    },
  }));
}
