/**
 * ANSIエスケープシーケンス除去ユーティリティ
 */

/**
 * ANSIエスケープシーケンス、スピナー、その他の制御文字を除去
 * @param text 処理対象のテキスト
 * @returns クリーンなテキスト
 */
export function stripAnsiCodes(text: string): string {
  let cleanText = text;
  
  // 1. 包括的なANSIエスケープシーケンスを除去
  // ESC[ で始まる制御シーケンス（CSI）- より包括的なパターン
  cleanText = cleanText.replace(/\x1b\[[0-9;:]*[a-zA-Z@]/g, '');
  
  // ESC] で始まるOSCシーケンス（Operating System Command）
  cleanText = cleanText.replace(/\x1b\][^\x07]*\x07/g, '');
  cleanText = cleanText.replace(/\x1b\][^\x1b]*\x1b\\/g, '');
  
  // ESC( で始まる文字集合選択シーケンス
  cleanText = cleanText.replace(/\x1b\([AB0]/g, '');
  
  // プライベートモード設定/リセット（DEC Private Mode）
  cleanText = cleanText.replace(/\x1b\[\?[0-9]+[hl]/g, '');
  
  // 8ビット制御文字（C1 control characters）
  cleanText = cleanText.replace(/[\x80-\x9F]/g, '');
  
  // その他のエスケープシーケンス
  cleanText = cleanText.replace(/\x1b[NOPVWXYZ\\^_]/g, '');
  cleanText = cleanText.replace(/\x1b[#()*/+-]/g, '');
  
  // 2. スピナー文字を除去（より包括的）
  const spinnerRegex = /[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏⠿⠾⠽⠻⠺⠯⠟⠞⠜⠛⠚⠉⠈⠁]/g;
  cleanText = cleanText.replace(spinnerRegex, '');
  
  // 3. プログレスバー文字を除去
  cleanText = cleanText.replace(/[▁▂▃▄▅▆▇█░▒▓■□▪▫▬▭▮▯―]/g, '');
  
  // 4. その他の特殊文字
  cleanText = cleanText.replace(/[♠♣♥♦♪♫]/g, '');
  
  // 5. 制御文字を除去（改行文字は除く）
  cleanText = cleanText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 6. 文字列の始まりや終わりにある不完全なエスケープシーケンス
  cleanText = cleanText.replace(/^\x1b.*?(?=[a-zA-Z0-9]|$)/g, '');
  cleanText = cleanText.replace(/\x1b[^a-zA-Z]*$/g, '');
  
  // 7. ANSIカラーコードの残骸（数字の断片）を除去
  // "787878"や"78"のような数字の並びがテキストの前に現れる場合
  cleanText = cleanText.replace(/^[\d;]+(?=\S)/g, '');
  
  // 8. 数字のみの断片（"7 8"のような）を除去
  cleanText = cleanText.replace(/^\s*\d+\s*\d*\s*$/g, '');
  
  // 9. 開いた括弧のみ（"[[[" のような）を除去
  cleanText = cleanText.replace(/^\s*[\[\{]+\s*$/g, '');
  
  // 10. 連続する数字の断片をテキストから除去（より積極的）
  cleanText = cleanText.replace(/(\d{2,})\s*(?=[\u2713\u2717✓✗])/g, ''); // チェックマーク前の数字
  cleanText = cleanText.replace(/^(\d+)\s*(\S)/g, '$2'); // 行の先頭の数字を除去
  
  // 11. 重複するThinkingを統合（行内に複数のThinkingがある場合）
  cleanText = cleanText.replace(/(thinking\.?\.?\.?\s*){2,}/gi, 'Thinking...');
  
  // 12. バックスペースとカリッジリターンを正規化
  cleanText = cleanText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  // 13. 余分な空白を正規化（ただし、意味のある構造は保持）
  cleanText = cleanText.replace(/[ \t]+/g, ' ');
  cleanText = cleanText.replace(/\n\s+\n/g, '\n\n');
  cleanText = cleanText.replace(/^\s+|\s+$/g, '');
  
  return cleanText;
}