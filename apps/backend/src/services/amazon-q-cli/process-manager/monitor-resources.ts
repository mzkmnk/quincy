import type { QProcessSession } from '../session-manager/types';

export async function monitorResources(session: QProcessSession): Promise<void> {
  if (!session.pid) {
    return;
  }

  try {
    const usage = process.cpuUsage();
    const memUsage = process.memoryUsage();
    
    // 概算値として設定（実際のプロセス固有値の取得は OS依存）
    session.cpuUsage = (usage.user + usage.system) / 1000; // マイクロ秒をミリ秒に
    session.memoryUsage = memUsage.rss / (1024 * 1024); // バイトをMBに
    session.lastActivity = Date.now();
  } catch {
    // エラーは無視
  }
}