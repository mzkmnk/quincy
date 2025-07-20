/**
 * レンダリングパフォーマンスを測定する
 */
export function measureRenderPerformance(name: string): {
  start: () => void;
  end: () => number;
} {
  let startTime: number;

  return {
    start: () => {
      startTime = performance.now();
      performance.mark(`${name}-start`);
    },
    end: () => {
      const endTime = performance.now();
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      return endTime - startTime;
    },
  };
}

/**
 * Change Detection のパフォーマンスを測定する
 */
export function measureChangeDetection(
  callback: () => void,
  name: string = 'change-detection'
): number {
  const measurement = measureRenderPerformance(name);

  measurement.start();
  callback();
  return measurement.end();
}

/**
 * FPS（フレームレート）を測定する
 */
export function measureFPS(duration: number = 1000): Promise<number> {
  return new Promise(resolve => {
    let frames = 0;
    const startTime = performance.now();

    function countFrame() {
      frames++;
      const currentTime = performance.now();

      if (currentTime - startTime < duration) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = (frames * 1000) / duration;
        resolve(fps);
      }
    }

    requestAnimationFrame(countFrame);
  });
}
