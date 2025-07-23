import type { QResponseEvent } from '@quincy/shared';

import type { QProcessSession } from '../session-manager/types';
import { stripAnsiCodes } from '../../../utils/ansi-stripper';
import { parseToolUsage } from '../../amazon-q-message-parser';

/**
 * シンプルなstdoutハンドラー - claudecodeui方式を参考にした実装
 * 段落処理やタイムアウトバッファリングを排除し、リアルタイム性を重視
 */
export function handleStdout(
  session: QProcessSession,
  data: Buffer,
  emitCallback: (event: string, data: QResponseEvent) => void,
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
  for (const line of lines) {
    processLine(session, line, emitCallback, emitPromptReadyCallback);
  }
}

/**
 * 単一行を処理する
 */
function processLine(
  session: QProcessSession,
  line: string,
  emitCallback: (event: string, data: QResponseEvent) => void,
  emitPromptReadyCallback?: (sessionId: string) => void
): void {
  const cleanLine = stripAnsiCodes(line);

  // プロンプト準備完了の検出（>のみの行）
  if (cleanLine.trim() === '>') {
    // ツール状態をリセット
    session.currentTools = [];

    console.log(`Prompt ready detected for session: ${session.sessionId}, resetting tool state`);

    if (emitPromptReadyCallback) {
      emitPromptReadyCallback(session.sessionId);
    }
    return; // プロンプト行は送信しない
  }

  // 無意味な記号のみの行はスキップ
  if (cleanLine === '>>' || cleanLine === '>>>') {
    return;
  }

  // thinkingメッセージは完全にスキップ
  if (isThinkingMessage(cleanLine)) {
    return;
  }

  // ツール検出と処理（元の行で検出、クリーンな行で処理）
  const toolDetection = parseToolUsage(line);
  if (toolDetection.hasTools) {
    // ツール情報をセッションに蓄積
    session.currentTools = [...(session.currentTools || []), ...toolDetection.tools];

    // ツール行のみの場合はスキップ
    if (!stripAnsiCodes(toolDetection.cleanedLine).trim()) {
      return;
    }

    // ツールとコンテンツが混在する場合は、ANSIクリーン済みの行を送信
    sendMessage(session, stripAnsiCodes(toolDetection.cleanedLine) + '\n', emitCallback);
  } else {
    // 通常の行を送信（ANSIクリーン済み）
    sendMessage(session, cleanLine + '\n', emitCallback);
  }
}

/**
 * メッセージを送信する
 */
function sendMessage(
  session: QProcessSession,
  content: string,
  emitCallback: (event: string, data: QResponseEvent) => void
): void {
  const responseEvent: QResponseEvent = {
    sessionId: session.sessionId,
    data: content,
    type: 'stream',
    tools: session.currentTools || [],
    hasToolContent: (session.currentTools || []).length > 0,
  };

  emitCallback('q:response', responseEvent);
}

/**
 * thinkingメッセージかどうかを判定
 */
function isThinkingMessage(line: string): boolean {
  const trimmed = line.trim().toLowerCase();
  return trimmed === 'thinking' || trimmed === 'thinking...';
}
