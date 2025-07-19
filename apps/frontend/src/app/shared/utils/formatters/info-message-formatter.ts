/**
 * 情報メッセージをフォーマットする
 * @param message メッセージ内容
 * @param type メッセージタイプ
 * @returns フォーマットされたメッセージ
 */
export function formatInfoMessage(
  message: string,
  type: 'info' | 'warning' | 'error' | 'success' = 'info'
): string {
  const prefixes = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  const prefix = prefixes[type] || '';
  return `${prefix} ${message}`.trim();
}
