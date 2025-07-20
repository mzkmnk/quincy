/**
 * 情報メッセージをフォーマットする
 * @param data 情報データ
 * @returns フォーマットされたメッセージ（または null）
 */
export function formatInfoMessage(data: {
  sessionId: string;
  message: string;
  type?: string;
}): string | null {
  const trimmed = data.message.trim();

  // 空のメッセージはスキップ
  if (!trimmed) {
    return null;
  }

  // 特別なメッセージの処理
  const lowerTrimmed = trimmed.toLowerCase();
  if (lowerTrimmed === 'thinking' || lowerTrimmed === 'thinking...') {
    return `🤔 Thinking...`;
  }

  // メッセージタイプに基づいてフォーマット
  switch (data.type) {
    case 'initialization':
      return `ℹ️ ${trimmed}`;
    case 'status':
      return `✅ ${trimmed}`;
    case 'progress':
      return `⏳ ${trimmed}`;
    case 'general':
    default:
      return `💬 ${trimmed}`;
  }
}
