import type { QProcessSession } from './types';

export class SessionManager {
  private sessions: Map<string, QProcessSession> = new Map();

  /**
   * セッションIDを生成
   */
  generateSessionId(): string {
    return `q_session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * セッションを追加
   */
  addSession(session: QProcessSession): void {
    this.sessions.set(session.sessionId, session);
    console.log(`✅ Session created: ${session.sessionId} (Total sessions: ${this.sessions.size})`);
  }

  /**
   * セッションを取得
   */
  getSession(sessionId: string): QProcessSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * セッションを削除
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`🗑️ Session ${sessionId} deleted`);
  }

  /**
   * アクティブなセッション一覧を取得
   */
  getActiveSessions(): QProcessSession[] {
    const activeSessions = Array.from(this.sessions.values()).filter(
      session => ['starting', 'running'].includes(session.status)
    );
    
    console.log(`📊 Active sessions: ${activeSessions.length}/${this.sessions.size} total`);
    return activeSessions;
  }

  /**
   * 全セッションを取得
   */
  getAllSessions(): QProcessSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * セッションが存在するか確認
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * セッションの実行時間を取得
   */
  getSessionRuntime(sessionId: string): number {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return 0;
    }
    
    return Date.now() - session.startTime;
  }

  /**
   * セッションのリソース使用量を更新
   */
  async updateSessionResources(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.pid) {
      return;
    }

    try {
      const usage = process.cpuUsage();
      const memUsage = process.memoryUsage();
      
      // 概算値として設定（実際のプロセス固有値の取得は OS依存）
      session.cpuUsage = (usage.user + usage.system) / 1000; // マイクロ秒をミリ秒に
      session.memoryUsage = memUsage.rss / (1024 * 1024); // バイトをMBに
      session.lastActivity = Date.now();
    } catch (error) {
      console.warn(`Failed to update resources for session ${sessionId}:`, error);
    }
  }

  /**
   * セッションを無効化（削除前の状態変更）
   */
  invalidateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'terminated';
      console.log(`🔄 Session ${sessionId} marked as terminated`);
    }
  }

  /**
   * 全セッションをクリア
   */
  clear(): void {
    this.sessions.clear();
  }

  /**
   * セッション数を取得
   */
  get size(): number {
    return this.sessions.size;
  }
}