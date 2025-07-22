/**
 * Amazon Q CLIの`>`プロンプト検出ロジック
 *
 * ユーザーの入力待ち状態（`>`プロンプト表示）を検出する。
 * Thinking状態やツール実行中は除外する。
 */

export function detectPromptReady(
  outputLine: string,
  isThinkingActive: boolean,
  isToolExecuting: boolean
): boolean {
  const trimmed = outputLine.trim();

  // `>`が単独で表示され、他の処理が実行中でない場合を検出
  const isPromptPattern = /^>\s*$/.test(trimmed);
  const isNotBusy = !isThinkingActive && !isToolExecuting;

  return isPromptPattern && isNotBusy;
}
