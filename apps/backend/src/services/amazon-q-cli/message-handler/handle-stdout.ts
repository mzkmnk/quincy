import type { QResponseEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';
import { stripAnsiCodes } from '../../../utils/ansi-stripper';
import { parseToolUsage } from '../../amazon-q-message-parser';

import { isInitializationMessage } from './is-initialization-message';
import { isInitializationComplete } from './is-initialization-complete';
import { detectPromptReady } from './detect-prompt-ready';
import { resetThinkingFlag } from './should-send-thinking';
import { isThinkingMessage } from './is-thinking-message';
import { processParagraph } from './process-paragraph';

export function handleStdout(
  session: QProcessSession,
  data: Buffer,
  emitCallback: (event: string, data: QResponseEvent) => void,
  flushIncompleteLineCallback: (
    session: QProcessSession,
    emitCallback: (event: string, data: QResponseEvent) => void,
    emitPromptReadyCallback?: (sessionId: string) => void
  ) => void,
  emitPromptReadyCallback?: (sessionId: string) => void
): void {
  session.lastActivity = Date.now();
  const rawOutput = data.toString();

  // 前回の不完全な行と結合
  const fullText = session.incompleteOutputLine + rawOutput;

  // 行単位で分割
  const lines = fullText.split('\n');

  // 最後の要素は不完全な行の可能性があるため、次回に回す
  session.incompleteOutputLine = lines.pop() || '';

  // 完全な行のみを処理
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const cleanLine = stripAnsiCodes(line);

    // プロンプト準備完了の検出（スキップより前に実行）
    if (detectPromptReady(cleanLine)) {
      // 段落処理をフラッシュ
      const remainingParagraph = session.paragraphProcessor.forceFlush();
      if (remainingParagraph) {
        processParagraph(session, remainingParagraph, emitCallback);
      }

      // プロンプト準備完了時にツール状態をリセット
      session.currentTools = [];

      // thinking送信フラグもリセット
      resetThinkingFlag(session);

      console.log(
        `Prompt ready detected for session: ${session.sessionId}, resetting tool state and thinking flag, enabling chat`
      );

      if (emitPromptReadyCallback) {
        emitPromptReadyCallback(session.sessionId);
      }
      continue; // プロンプト行は通常処理をスキップ
    }

    // 無意味な記号のみの行はスキップ（ただし>はプロンプト検出で処理済み）
    if (cleanLine === '>>' || cleanLine === '>>>') {
      continue;
    }

    // 初期化フェーズで初期化メッセージはスキップ（stderrで処理）
    if (session.initializationPhase && isInitializationMessage(cleanLine)) {
      continue;
    }

    // 初期化完了検知
    if (session.initializationPhase && isInitializationComplete(cleanLine)) {
      session.initializationPhase = false;
      console.log(`Amazon Q CLI initialization completed for session: ${session.sessionId}`);

      // 段落処理をフラッシュ
      const remainingParagraph = session.paragraphProcessor.forceFlush();
      if (remainingParagraph) {
        processParagraph(session, remainingParagraph, emitCallback);
      }

      // 初期化完了時にプロンプト準備完了として通知
      if (emitPromptReadyCallback) {
        emitPromptReadyCallback(session.sessionId);
      }

      // 初期化完了メッセージをレスポンスとして送信
      const responseEvent: QResponseEvent = {
        sessionId: session.sessionId,
        data: cleanLine + '\n',
        type: 'stream',
        tools: session.currentTools || [],
        hasToolContent: (session.currentTools || []).length > 0,
      };
      emitCallback('q:response', responseEvent);
      continue;
    }

    // 「Thinking」メッセージは完全にスキップ（フロントエンドでLoading状態で制御）
    if (isThinkingMessage(cleanLine)) {
      continue; // thinking メッセージはスキップ
    }

    // ツール検出（段落処理とは別に行う）
    const toolDetection = parseToolUsage(cleanLine);
    if (toolDetection.hasTools) {
      // ツール情報をセッションに蓄積
      session.currentTools = [...(session.currentTools || []), ...toolDetection.tools];
      // ツール行自体はスキップし、クリーンな行があれば通常の行として処理
      if (!toolDetection.cleanedLine.trim()) {
        continue;
      }
      // クリーンな行がある場合は、それを段落処理に渡す
      const paragraph = session.paragraphProcessor.addLine(toolDetection.cleanedLine);
      if (paragraph) {
        processParagraph(session, paragraph, emitCallback);
      }
    } else {
      // ツールが含まれない通常の行の処理
      const paragraph = session.paragraphProcessor.addLine(line);
      if (paragraph) {
        processParagraph(session, paragraph, emitCallback);
      }
    }
  }

  // 段落処理のタイムアウト（常に設定）
  if (session.bufferTimeout) {
    clearTimeout(session.bufferTimeout);
  }

  session.bufferTimeout = setTimeout(() => {
    // 段落処理をフラッシュ
    const remainingParagraph = session.paragraphProcessor.forceFlush();
    if (remainingParagraph) {
      processParagraph(session, remainingParagraph, emitCallback);
    }
    // 不完全な行もフラッシュ
    if (session.incompleteOutputLine.trim()) {
      flushIncompleteLineCallback(session, emitCallback);
    }
  }, 200); // 200ms後にフラッシュ
}
