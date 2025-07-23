// Vitest setup file - テスト実行前にEventEmitterの設定を行う

// EventEmitterの最大リスナー数を無制限にしてメモリリーク警告を回避（テスト環境のみ）
process.setMaxListeners(0);

// MaxListenersExceededWarning警告を無視（テスト環境のみ）
/* eslint-disable @typescript-eslint/no-explicit-any */
const originalEmit = process.emit;
(process.emit as any) = function (this: any, event: string | symbol, ...args: any[]): boolean {
  if (event === 'warning' && args[0]?.name === 'MaxListenersExceededWarning') {
    return false; // 警告を無視
  }
  return (originalEmit as any).apply(this, [event, ...args]);
};
/* eslint-enable @typescript-eslint/no-explicit-any */

// テスト実行中のプロセス終了時にリスナーをクリーンアップ
process.on('exit', () => {
  process.removeAllListeners();
});

process.on('SIGINT', () => {
  process.removeAllListeners();
  process.exit(0);
});

process.on('SIGTERM', () => {
  process.removeAllListeners();
  process.exit(0);
});
