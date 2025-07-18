/**
 * 環境情報を抽出
 */

import type { EnvironmentState, HistoryEntry } from '../amazon-q-history-types';

export function extractEnvironmentInfo(entries: HistoryEntry[]): EnvironmentState {
  // 最初のエントリから環境情報を取得
  if (entries.length > 0) {
    const [inputMessage] = entries[0];
    return inputMessage.env_context.env_state;
  }
  
  return {
    operating_system: 'unknown',
    current_working_directory: 'unknown',
    environment_variables: []
  };
}