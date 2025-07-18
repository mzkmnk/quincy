/**
 * 配列形式のhistoryデータをHistoryData形式に正規化
 */

import type { HistoryData } from '../amazon-q-history-types';

export function normalizeHistoryData(data: unknown): HistoryData {
  if (Array.isArray(data)) {
    return { history: data };
  }
  
  if (data && typeof data === 'object' && 'history' in data) {
    return data as HistoryData;
  }
  
  throw new Error('Invalid history data format');
}