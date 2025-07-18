export function startResourceMonitoring(
  updateCallback: () => Promise<void>,
  intervalMs: number = 30000
): NodeJS.Timeout {
  return setInterval(() => {
    updateCallback().catch(() => {
      // エラーは無視
    });
  }, intervalMs);
}