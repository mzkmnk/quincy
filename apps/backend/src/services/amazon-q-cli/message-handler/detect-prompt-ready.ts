/**
 * Amazon Q CLIの`>`プロンプト検出ロジック（シンプル版）
 *
 * ユーザーの入力待ち状態（`>`プロンプト表示）を検出する。
 * `>`が表示されたら一律で応答終了と判定する。
 */

export function detectPromptReady(outputLine: string): boolean {
  const trimmed = outputLine.trim();

  // `>`が単独で表示されるパターンを検出（応答終了のサイン）
  const isPromptPattern = /^>\s*$/.test(trimmed);

  // シンプル化: `>`が表示されたら一律でプロンプト準備完了
  // ツール実行中やthinking状態に関係なく、`>`で応答終了と判定

  console.log(
    `Prompt detection: line='${trimmed}', pattern=${isPromptPattern}, always ready when prompt found`
  );

  return isPromptPattern;
}
