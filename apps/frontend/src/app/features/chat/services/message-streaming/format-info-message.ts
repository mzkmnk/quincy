/**
 * Unicode装飾文字を除去する
 * @param text 処理対象のテキスト
 * @returns クリーンなテキスト
 */
function stripUnicodeDecorations(text: string): string {
  let cleanText = text;
  
  // Brailleパターン（U+2800-U+28FF）を除去
  cleanText = cleanText.replace(/[\u2800-\u28FF]/g, '');
  
  // Unicodeボックス描画文字（U+2500-U+257F）を除去
  cleanText = cleanText.replace(/[\u2500-\u257F]/g, '');
  
  // CJK統合漢字拡張（装飾文字）の一部を除去
  cleanText = cleanText.replace(/[\u23C0-\u23FF]/g, '');
  
  // プログレスバー文字を除去
  cleanText = cleanText.replace(/[▁▂▃▄▅▆▇█░▒▓■□▪▫▬▭▮▯―]/g, '');
  
  // Unicodeスペース文字（通常のスペース以外）を除去
  cleanText = cleanText.replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '');
  
  // 余分な空白を正規化
  cleanText = cleanText.replace(/\s+/g, ' ').trim();
  
  return cleanText;
}

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
  // Unicode装飾文字を除去してからトリム
  const cleanedMessage = stripUnicodeDecorations(data.message);
  const trimmed = cleanedMessage.trim();

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
