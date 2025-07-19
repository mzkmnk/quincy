/**
 * メモリ使用量を監視する
 */
export function measureMemoryUsage(): Promise<number> {
  return new Promise((resolve) => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      resolve(memInfo.usedJSHeapSize);
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
    if ('gc' in window) {
      (window as any).gc();
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