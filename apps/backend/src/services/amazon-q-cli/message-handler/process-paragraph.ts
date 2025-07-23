/**
 * 段落を処理してレスポンスイベントを発行する
 */

import type { QResponseEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';
import { stripAnsiCodes } from '../../../utils/ansi-stripper';
import { parseToolUsage, filterToolOutput } from '../../amazon-q-message-parser';

/**
 * 完成した段落を処理する
 */
export function processParagraph(
  session: QProcessSession,
  paragraph: string,
  emitCallback: (event: string, data: QResponseEvent) => void
): void {
  const cleanParagraph = stripAnsiCodes(paragraph);

  // ツール実行の詳細出力をフィルタリング
  const filterResult = filterToolOutput(cleanParagraph);
  if (filterResult.shouldSkip) {
    return;
  }

  // ツール検出処理
  const toolDetection = parseToolUsage(cleanParagraph);
  if (toolDetection.hasTools) {
    // ツール情報をセッションに蓄積
    session.currentTools = [...(session.currentTools || []), ...toolDetection.tools];

    // クリーンな段落が空でない場合のみレスポンスイベントを発行
    if (toolDetection.cleanedLine.trim()) {
      const responseEvent: QResponseEvent = {
        sessionId: session.sessionId,
        data: toolDetection.cleanedLine + '\n\n', // 段落の後は2つの改行
        type: 'stream',
        tools: session.currentTools,
        hasToolContent: session.currentTools.length > 0,
      };
      emitCallback('q:response', responseEvent);
    }
    return;
  }

  // 通常の段落として処理
  if (cleanParagraph.trim()) {
    const responseEvent: QResponseEvent = {
      sessionId: session.sessionId,
      data: cleanParagraph + '\n\n', // 段落の後は2つの改行
      type: 'stream',
      tools: session.currentTools || [],
      hasToolContent: (session.currentTools || []).length > 0,
    };

    emitCallback('q:response', responseEvent);
  }
}
