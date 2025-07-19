/**
 * 接続ステータスに基づいてCSSクラスを取得する
 */
export function getConnectionStatusClass(connected: boolean, connecting: boolean): string {
  if (connected) {
    return 'bg-green-500';
  }
  if (connecting) {
    return 'bg-orange-500 animate-pulse';
  }
  return 'bg-red-500';
}
