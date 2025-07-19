/**
 * 日付を指定のフォーマットで文字列に変換する
 * @param date 日付（Dateオブジェクト、タイムスタンプ、または文字列）
 * @param format フォーマット（'short', 'long', 'time'）
 * @returns フォーマットされた日付文字列
 */
export function formatDate(
  date: Date | number | string,
  format: 'short' | 'long' | 'time' = 'short'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);

  if (isNaN(dateObj.getTime())) {
    return '';
  }

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

    case 'long':
      return dateObj.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      });

    case 'time':
      return dateObj.toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

    default:
      return dateObj.toLocaleString('ja-JP');
  }
}
