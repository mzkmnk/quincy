/**
 * 環境情報を読みやすい形式に整形
 */

import type { EnvironmentState } from '../amazon-q-history-types';

export function formatEnvironmentInfo(environmentInfo: EnvironmentState): string {
  const lines = [
    `💻 OS: ${environmentInfo.operating_system}`,
    `📁 作業ディレクトリ: ${environmentInfo.current_working_directory}`
  ];
  
  if (environmentInfo.environment_variables.length > 0) {
    lines.push(`🔧 環境変数: ${environmentInfo.environment_variables.length}個`);
  }
  
  return lines.join('\n');
}