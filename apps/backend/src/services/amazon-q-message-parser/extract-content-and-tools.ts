import { parseToolUsage } from './parse-tool-usage';

/**
 * メッセージ解析結果
 */
export interface ParsedMessage {
  content: string;
  tools: string[];
  hasToolContent: boolean;
  originalMessage: string;
}

/**
 * メッセージからコンテンツとツール情報を分離する
 *
 * @param message 元のメッセージ
 * @returns 分離されたコンテンツとツール情報
 */
export function extractContentAndTools(message: string): ParsedMessage {
  // 型安全性のチェック
  if (!message || typeof message !== 'string') {
    return {
      content: '',
      tools: [],
      hasToolContent: false,
      originalMessage: message || '',
    };
  }

  const allTools: string[] = [];
  let cleanedContent = message;

  // 行ごとに処理
  const lines = message.split('\n');
  const processedLines: string[] = [];

  for (const line of lines) {
    const detection = parseToolUsage(line);

    if (detection.hasTools) {
      // ツール情報を収集
      allTools.push(...detection.tools);

      // クリーンな行が空でない場合のみ追加
      if (detection.cleanedLine.trim()) {
        processedLines.push(detection.cleanedLine);
      }
    } else {
      // ツールがない行はそのまま追加
      processedLines.push(line);
    }
  }

  // 重複ツールを除去
  const uniqueTools = Array.from(new Set(allTools));

  // 余分な空行を除去しつつ、適切な改行を保持
  cleanedContent = processedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') // 3つ以上の連続改行を2つに
    .trim();

  return {
    content: cleanedContent,
    tools: uniqueTools,
    hasToolContent: uniqueTools.length > 0,
    originalMessage: message,
  };
}
