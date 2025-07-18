/**
 * エラーを表示すべきかどうかを判定する
 * @param error エラーメッセージ
 * @returns エラーを表示するかどうか
 */
export function shouldDisplayError(error: string): boolean {
  const trimmed = error.trim();

  // 空のエラーは表示しない
  if (!trimmed) {
    return false;
  }

  // 初期化メッセージや情報メッセージは表示しない
  const skipPatterns = [
    /^\s*[\x00-\x1f]\s*$/,                            // 制御文字のみ
    /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]\s*$/, // スピナー文字のみ
    /mcp servers? initialized/i,                       // MCPサーバー初期化メッセージ
    /ctrl-c to start chatting/i,                       // チャット開始指示
    /press.*enter.*continue/i,                         // Enterキー指示
    /loading|initializing/i,                           // ローディングメッセージ
    /^\s*m\s*$/,                                       // 単一の'm'文字
  ];

  return !skipPatterns.some(pattern => pattern.test(trimmed));
}