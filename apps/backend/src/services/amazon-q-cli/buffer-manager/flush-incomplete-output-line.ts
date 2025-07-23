import type { QResponseEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';
import { stripAnsiCodes } from '../../../utils/ansi-stripper';
import { shouldSkipOutput, isInitializationMessage, processParagraph } from '../message-handler';

export function flushIncompleteOutputLine(
  session: QProcessSession,
  emitCallback: (event: string, data: QResponseEvent) => void
): void {
  // 段落処理をフラッシュ
  const remainingParagraph = session.paragraphProcessor.forceFlush();
  if (remainingParagraph) {
    processParagraph(session, remainingParagraph, emitCallback);
  }

  if (!session.incompleteOutputLine.trim()) {
    return;
  }

  const cleanLine = stripAnsiCodes(session.incompleteOutputLine);

  // 無意味な行はスキップ
  if (!shouldSkipOutput(cleanLine)) {
    // 初期化フェーズで初期化メッセージはスキップ
    if (session.initializationPhase && isInitializationMessage(cleanLine)) {
      session.incompleteOutputLine = '';
      return;
    }

    // 最後の不完全な行を段落として処理
    session.paragraphProcessor.addLine(session.incompleteOutputLine);
    const lastParagraph = session.paragraphProcessor.forceFlush();
    if (lastParagraph) {
      processParagraph(session, lastParagraph, emitCallback);
    }
  }

  // 不完全な行をクリア
  session.incompleteOutputLine = '';
}
