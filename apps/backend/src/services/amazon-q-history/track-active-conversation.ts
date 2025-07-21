/**
 * conversation_id追跡システム
 * Amazon Q CLIプロセス開始後のconversation_id取得をポーリングで監視
 */

import type { QProcessSession } from '../amazon-q-cli/session-manager/types';

import { extractConversationIdFromDatabase } from './extract-conversation-id-from-sqlite';

// 追跡中のセッション管理
const activeTrackingSessions = new Map<string, TrackingSession>();

interface TrackingSession {
  sessionId: string;
  projectPath: string;
  pollTimer: NodeJS.Timeout;
  startTime: Date;
  options: TrackingOptions;
}

interface TrackingOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

/**
 * conversation_idの追跡を開始
 * @param session - 追跡対象セッション
 * @param emitCallback - イベント発火用コールバック
 * @param customDbPath - テスト用カスタムDBパス
 * @param options - 追跡オプション
 * @returns 追跡開始の成功/失敗
 */
export async function trackActiveConversation(
  session: QProcessSession,
  emitCallback: (event: string, data: any) => void,
  customDbPath?: string,
  options: TrackingOptions = {}
): Promise<boolean> {
  // 既に追跡中の場合は重複追跡を拒否
  if (activeTrackingSessions.has(session.sessionId)) {
    return false;
  }

  const trackingOptions = {
    timeoutMs: options.timeoutMs || 30000, // デフォルト30秒
    pollIntervalMs: options.pollIntervalMs || 1000, // デフォルト1秒
  };

  const trackingSession: TrackingSession = {
    sessionId: session.sessionId,
    projectPath: session.projectPath,
    pollTimer: null as any, // 後で設定
    startTime: new Date(),
    options: trackingOptions,
  };

  // ポーリング処理を開始
  const pollForConversationId = async () => {
    try {
      // タイムアウトチェック
      const elapsed = Date.now() - trackingSession.startTime.getTime();
      if (elapsed > trackingOptions.timeoutMs) {
        // タイムアウト発生
        ConversationTracker.stopTracking(session.sessionId);
        emitCallback('conversation:timeout', {
          sessionId: session.sessionId,
          error: 'conversation_id取得がタイムアウトしました',
        });
        return;
      }

      // conversation_idを取得試行
      const conversationId = await extractConversationIdFromDatabase(
        session.projectPath,
        customDbPath
      );

      if (conversationId) {
        // 成功: conversation_id取得完了
        ConversationTracker.stopTracking(session.sessionId);
        emitCallback('conversation:ready', {
          sessionId: session.sessionId,
          conversationId,
          projectPath: session.projectPath,
        });
      }
      // conversation_idが見つからない場合は、次のポーリングまで待機
    } catch (error) {
      // エラーが発生しても継続（ログ出力のみ）
      console.error('conversation_id取得エラー:', error);
    }
  };

  // 定期ポーリングタイマーを設定
  trackingSession.pollTimer = setInterval(pollForConversationId, trackingOptions.pollIntervalMs);

  // 初回実行
  await pollForConversationId();

  // 追跡セッションを登録
  activeTrackingSessions.set(session.sessionId, trackingSession);

  return true;
}

/**
 * ConversationTracker - 静的な追跡管理機能
 */
export class ConversationTracker {
  /**
   * 指定されたセッションが追跡中かどうかを確認
   */
  static isTracking(sessionId: string): boolean {
    return activeTrackingSessions.has(sessionId);
  }

  /**
   * 指定されたセッションの追跡を停止
   */
  static stopTracking(sessionId: string): void {
    const trackingSession = activeTrackingSessions.get(sessionId);
    if (trackingSession) {
      // タイマーをクリア
      clearInterval(trackingSession.pollTimer);
      // 追跡セッションを削除
      activeTrackingSessions.delete(sessionId);
    }
  }

  /**
   * 全ての追跡を停止（クリーンアップ用）
   */
  static stopAllTracking(): void {
    for (const sessionId of activeTrackingSessions.keys()) {
      ConversationTracker.stopTracking(sessionId);
    }
  }

  /**
   * 現在追跡中のセッション数を取得
   */
  static getActiveTrackingCount(): number {
    return activeTrackingSessions.size;
  }
}
