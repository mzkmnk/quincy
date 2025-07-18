import type { QProcessSession } from '../session-manager/types';
import type { QResponseEvent } from '@quincy/shared';
import { stripAnsiCodes } from '../../../utils/ansi-stripper';
import { shouldSkipOutput } from './should-skip-output';
import { isInitializationMessage } from './is-initialization-message';
import { isThinkingMessage } from './is-thinking-message';
import { shouldSkipThinking } from './should-skip-thinking';
import { updateThinkingState } from './update-thinking-state';

export function handleStdout(
  session: QProcessSession,
  data: Buffer,
  emitCallback: (event: string, data: any) => void,
  flushIncompleteLineCallback: (session: QProcessSession) => void
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
  for (const line of lines) {
    const cleanLine = stripAnsiCodes(line);
    
    // 空の行や無意味な行をスキップ
    if (shouldSkipOutput(cleanLine)) {
      continue;
    }
    
    // 初期化フェーズで初期化メッセージはスキップ（stderrで処理）
    if (session.initializationPhase && isInitializationMessage(cleanLine)) {
      continue;
    }
    
    // 「Thinking」メッセージの特別処理
    if (isThinkingMessage(cleanLine)) {
      if (shouldSkipThinking(session)) {
        continue;
      }
      // Thinking状態を更新
      updateThinkingState(session);
    }
    
    // 直接レスポンスイベントを発行（行ベース）
    const responseEvent: QResponseEvent = {
      sessionId: session.sessionId,
      data: cleanLine + '\n', // 改行を復元
      type: 'stream'
    };
    
    emitCallback('q:response', responseEvent);
  }
  
  // 不完全な行がある場合は短時間でタイムアウト処理
  if (session.incompleteOutputLine.trim()) {
    if (session.bufferTimeout) {
      clearTimeout(session.bufferTimeout);
    }
    
    session.bufferTimeout = setTimeout(() => {
      flushIncompleteLineCallback(session);
    }, 200); // 200ms後にフラッシュ
  }
}