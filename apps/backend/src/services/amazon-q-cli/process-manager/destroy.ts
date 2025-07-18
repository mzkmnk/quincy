export function destroy(
  resourceMonitorInterval?: NodeJS.Timeout,
  cleanupInterval?: NodeJS.Timeout
): void {
  // インターバルの停止
  if (resourceMonitorInterval) {
    clearInterval(resourceMonitorInterval);
  }

  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }
}