/**
 * ファイルパスを表示用にフォーマットする
 * @param path フォーマットするパス
 * @param options フォーマットオプション
 * @returns フォーマットされたパス
 */
export function formatPath(
  path: string,
  options: {
    showHome?: boolean;
    maxLength?: number;
    ellipsisPosition?: 'start' | 'middle' | 'end';
  } = {}
): string {
  if (!path) {
    return '';
  }

  let formatted = path;

  // ホームディレクトリを ~ に置換
  if (options.showHome) {
    // ブラウザ環境では一般的なパスを使用
    const homeDir = '/Users';
    if (formatted.startsWith(homeDir)) {
      formatted = formatted.replace(homeDir, '~');
    }
  }

  // 長さ制限
  if (options.maxLength && formatted.length > options.maxLength) {
    const ellipsis = '...';
    const maxLen = options.maxLength - ellipsis.length;

    switch (options.ellipsisPosition) {
      case 'start':
        formatted = ellipsis + formatted.substring(formatted.length - maxLen);
        break;

      case 'middle': {
        const halfLen = Math.floor(maxLen / 2);
        formatted =
          formatted.substring(0, halfLen) +
          ellipsis +
          formatted.substring(formatted.length - halfLen);
        break;
      }

      case 'end':
      default:
        formatted = formatted.substring(0, maxLen) + ellipsis;
        break;
    }
  }

  return formatted;
}
