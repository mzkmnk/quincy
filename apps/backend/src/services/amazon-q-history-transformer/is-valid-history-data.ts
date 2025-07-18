/**
 * historyデータが有効かチェック
 * 直接配列形式とネストされたオブジェクト形式の両方をサポート
 */

import type { HistoryData } from '../amazon-q-history-types';
import { validateHistoryEntries } from './validate-history-entries';

export function isValidHistoryData(data: unknown): data is HistoryData {
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // 直接配列形式の場合（Amazon Q CLIの実際の形式）
  if (Array.isArray(data)) {
    // 直接配列をHistoryData形式に正規化
    const normalizedData = { history: data };
    return validateHistoryEntries(normalizedData.history);
  }
  
  // ネストされたオブジェクト形式の場合（期待していた形式）
  const historyData = data as HistoryData;
  if (!Array.isArray(historyData.history)) {
    return false;
  }
  
  return validateHistoryEntries(historyData.history);
}