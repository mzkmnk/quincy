/**
 * メモリ使用量を監視する
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

export function measureMemoryUsage(): Promise<number> {
  return new Promise(resolve => {
    const perf = performance as ExtendedPerformance;
    if (perf.memory) {
      resolve(perf.memory.usedJSHeapSize);
    } else {
      // performance.memory が利用できない場合は0を返す
      resolve(0);
    }
  });
}

/**
 * メモリリークを検出する
 */
export async function detectMemoryLeak(
  testFunction: () => void | Promise<void>,
  iterations: number = 10
): Promise<boolean> {
  const measurements: number[] = [];

  for (let i = 0; i < iterations; i++) {
    await testFunction();

    // ガベージコレクションを強制実行（開発環境のみ）
    interface ExtendedWindow extends Window {
      gc?: () => void;
    }
    const win = window as ExtendedWindow;
    if (win.gc) {
      win.gc();
    }

    const memory = await measureMemoryUsage();
    measurements.push(memory);

    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  // メモリ使用量の傾向を分析
  const firstHalf = measurements.slice(0, Math.floor(iterations / 2));
  const secondHalf = measurements.slice(Math.floor(iterations / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  // 20%以上の増加をメモリリークとみなす
  return (secondAvg - firstAvg) / firstAvg > 0.2;
}
