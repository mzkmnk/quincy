/**
 * ANSI エスケープシーケンスパーサー
 * ターミナル制御文字の解析と除去
 */

import type { AnsiSegment, ColorInfo } from './types';

export class AnsiParser {
  // 一般的なANSIエスケープシーケンスパターン
  // eslint-disable-next-line no-control-regex
  private readonly ANSI_PATTERN = /\x1b\[[0-9;]*[a-zA-Z]|\x1b[78]|\x1b\[\?[0-9]+[hl]/g;

  // 256色カラーコードパターン
  // eslint-disable-next-line no-control-regex
  private readonly COLOR_256_PATTERN = /\x1b\[(38|48);5;(\d+)m/;

  /**
   * ANSIコードを除去する
   */
  removeAnsiCodes(input: string): string {
    return input.replace(this.ANSI_PATTERN, '');
  }

  /**
   * キャリッジリターンを考慮して最終的な表示テキストを抽出
   */
  extractVisibleText(input: string): string {
    // まずANSIコードを除去
    const withoutAnsi = this.removeAnsiCodes(input);

    // 改行で分割して処理
    const lines = withoutAnsi.split('\n');
    const processedLines = lines.map(line => {
      // キャリッジリターンで分割
      const segments = line.split('\r');
      // 最後のセグメントが実際に表示されるテキスト
      return segments[segments.length - 1];
    });

    return processedLines.join('\n');
  }

  /**
   * カラーコードを解析する
   */
  parseColorCode(ansiCode: string): ColorInfo | null {
    const match = ansiCode.match(this.COLOR_256_PATTERN);

    if (!match) {
      return null;
    }

    const type = match[1] === '38' ? 'foreground' : 'background';
    const colorIndex = parseInt(match[2], 10);

    // 基本的な色名マッピング（一部のみ）
    const colorNames: { [key: number]: string } = {
      10: 'bright-green',
      12: 'bright-blue',
      // 必要に応じて追加
    };

    return {
      type,
      colorIndex,
      colorName: colorNames[colorIndex] || `color-${colorIndex}`,
    };
  }

  /**
   * ANSIコードが含まれているかチェック
   */
  hasAnsiCodes(input: string): boolean {
    return input.includes('\x1b');
  }

  /**
   * ANSIコードで文字列を分割
   */
  splitByAnsi(input: string): AnsiSegment[] {
    const segments: AnsiSegment[] = [];
    let lastIndex = 0;

    // ANSIパターンをリセット
    this.ANSI_PATTERN.lastIndex = 0;

    let match;
    while ((match = this.ANSI_PATTERN.exec(input)) !== null) {
      // ANSIコード前のテキスト
      if (match.index > lastIndex) {
        segments.push({
          text: input.substring(lastIndex, match.index),
          ansiCode: '',
        });
      }

      // ANSIコード自体を次のセグメントのコードとして保存
      segments.push({
        text: '',
        ansiCode: match[0],
      });

      lastIndex = match.index + match[0].length;
    }

    // 残りのテキスト
    if (lastIndex < input.length) {
      segments.push({
        text: input.substring(lastIndex),
        ansiCode: '',
      });
    }

    // 空のセグメントを統合
    const merged: AnsiSegment[] = [];
    for (let i = 0; i < segments.length; i++) {
      const current = segments[i];
      const next = segments[i + 1];

      if (current.ansiCode && next && !next.ansiCode) {
        merged.push({
          text: next.text,
          ansiCode: current.ansiCode,
        });
        i++; // 次のセグメントをスキップ
      } else if (!current.ansiCode || current.text) {
        merged.push(current);
      }
    }

    return merged.filter(s => s.text || s.ansiCode);
  }
}
