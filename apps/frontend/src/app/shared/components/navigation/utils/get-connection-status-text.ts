/**
 * 接続ステータスに基づいてテキストを取得する
 */
export function getConnectionStatusText(connected: boolean, connecting: boolean): string {
  if (connected) {
    return 'Connected';
  }
  if (connecting) {
    return 'Connecting';
  }
  return 'Disconnected';
}
