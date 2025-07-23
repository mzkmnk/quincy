import type { QInfoEvent, QErrorEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';
import { stripAnsiCodes } from '../../../utils/ansi-stripper';

import { classifyStderrMessage } from './classify-stderr-message';
import { isInitializationMessage } from './is-initialization-message';
import { shouldSkipDuplicateInfo } from './should-skip-duplicate-info';
import { getInfoMessageType } from './get-info-message-type';
import { isThinkingMessage } from './is-thinking-message';

export function handleStderr(
  session: QProcessSession,
  data: Buffer,
  emitCallback: (event: string, data: QInfoEvent | QErrorEvent) => void,
  addToInitializationBufferCallback: (session: QProcessSession, message: string) => void,
  flushIncompleteErrorLineCallback: (session: QProcessSession) => void
): void {
  session.lastActivity = Date.now();
  const rawError = data.toString();

  // 前回の不完全な行と結合
  const fullText = session.incompleteErrorLine + rawError;

  // 行単位で分割
  const lines = fullText.split('\n');

  // 最後の要素は不完全な行の可能性があるため、次回に回す
  session.incompleteErrorLine = lines.pop() || '';

  // 完全な行のみを処理
  for (const line of lines) {
    const cleanLine = stripAnsiCodes(line);

    // メッセージを分類
    const messageType = classifyStderrMessage(cleanLine);

    if (messageType === 'skip') {
      continue;
    }

    if (messageType === 'info') {
      // 初期化フェーズの処理
      if (session.initializationPhase && isInitializationMessage(cleanLine)) {
        addToInitializationBufferCallback(session, cleanLine);
        continue;
      }

      // Thinkingメッセージは完全にスキップ（フロントエンドでLoading状態で制御）
      if (isThinkingMessage(cleanLine)) {
        continue; // thinking メッセージはスキップ
      }

      // 通常の重複メッセージチェック
      if (shouldSkipDuplicateInfo(session, cleanLine)) {
        continue;
      }

      // 情報メッセージとしてq:infoイベントを発行
      const infoEvent: QInfoEvent = {
        sessionId: session.sessionId,
        message: cleanLine,
        type: getInfoMessageType(cleanLine),
      };

      emitCallback('q:info', infoEvent);
    } else if (messageType === 'error') {
      // エラーメッセージとしてq:errorイベントを発行
      const errorEvent: QErrorEvent = {
        sessionId: session.sessionId,
        error: cleanLine,
        code: 'STDERR',
      };

      emitCallback('q:error', errorEvent);
    }
  }

  // 不完全なエラー行がある場合は短時間でタイムアウト処理
  if (session.incompleteErrorLine.trim()) {
    setTimeout(() => {
      flushIncompleteErrorLineCallback(session);
    }, 200); // 200ms後にフラッシュ
  }
}
