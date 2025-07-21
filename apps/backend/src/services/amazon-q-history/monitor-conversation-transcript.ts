/**
 * transcript配列変更監視システム
 * Amazon Q CLIのSQLite3データベースでtranscript配列の変更を監視し、
 * 新規メッセージをリアルタイムで検出・通知する
 */

import * as path from 'path';
import * as os from 'os';

import Database from 'better-sqlite3';

// 監視中のconversation管理
const activeMonitoringSessions = new Map<string, MonitoringSession>();

interface MonitoringSession {
  conversationId: string;
  projectPath: string;
  pollTimer: NodeJS.Timeout;
  startTime: Date;
  lastTranscriptLength: number;
  options: MonitoringOptions;
}

interface MonitoringOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}

interface TranscriptMessage {
  role: 'user' | 'assistant';
  content: Array<{ text: string }>;
}

/**
 * conversation_idに基づいてtranscript変更の監視を開始
 * @param conversationId - 監視対象のconversation_id
 * @param projectPath - プロジェクトパス
 * @param emitCallback - イベント発火用コールバック
 * @param customDbPath - テスト用カスタムDBパス
 * @param options - 監視オプション
 * @returns 監視開始の成功/失敗
 */
export async function monitorConversationTranscript(
  conversationId: string,
  projectPath: string,
  emitCallback: (event: string, data: any) => void,
  customDbPath?: string,
  options: MonitoringOptions = {}
): Promise<boolean> {
  // 既に監視中の場合は重複監視を拒否
  if (activeMonitoringSessions.has(conversationId)) {
    return false;
  }

  const monitoringOptions = {
    timeoutMs: options.timeoutMs || 300000, // デフォルト5分
    pollIntervalMs: options.pollIntervalMs || 2000, // デフォルト2秒
  };

  const monitoringSession: MonitoringSession = {
    conversationId,
    projectPath,
    pollTimer: null as any, // 後で設定
    startTime: new Date(),
    lastTranscriptLength: 0,
    options: monitoringOptions,
  };

  // ポーリング処理を開始
  const pollForTranscriptChanges = async () => {
    try {
      // タイムアウトチェック
      const elapsed = Date.now() - monitoringSession.startTime.getTime();
      if (elapsed > monitoringOptions.timeoutMs) {
        // タイムアウト発生
        TranscriptMonitor.stopMonitoring(conversationId);
        emitCallback('conversation:timeout', {
          conversationId,
          error: 'transcript監視がタイムアウトしました',
        });
        return;
      }

      // transcript配列を取得
      const currentTranscript = await getTranscriptFromDatabase(
        projectPath,
        conversationId,
        customDbPath
      );

      if (!currentTranscript) {
        // transcriptが見つからない場合は次のポーリングまで待機
        return;
      }

      // 新規メッセージの検出
      const currentLength = currentTranscript.length;
      if (currentLength > monitoringSession.lastTranscriptLength) {
        // 新しいメッセージを抽出
        const newMessages = currentTranscript.slice(monitoringSession.lastTranscriptLength);

        // 長さを更新
        monitoringSession.lastTranscriptLength = currentLength;

        // メッセージ更新イベントを発火
        emitCallback('conversation:transcript-update', {
          conversationId,
          newMessages,
          totalMessageCount: currentLength,
        });

        // ツール使用の検出
        const toolActivity = detectToolUsage(newMessages);
        if (toolActivity.length > 0) {
          for (const activity of toolActivity) {
            emitCallback('conversation:tool-activity', {
              conversationId,
              tools: activity.tools,
              message: activity.message,
            });
          }
        }
      }
    } catch (error) {
      // エラーが発生しても継続（ログ出力のみ）
      console.error('transcript監視エラー:', error);
    }
  };

  // 初回実行でtranscriptの現在の長さを取得
  try {
    const initialTranscript = await getTranscriptFromDatabase(
      projectPath,
      conversationId,
      customDbPath
    );
    if (initialTranscript) {
      monitoringSession.lastTranscriptLength = initialTranscript.length;
    }
  } catch (error) {
    // 初期化エラーでも継続
    console.error('transcript初期化エラー:', error);
  }

  // 定期ポーリングタイマーを設定
  monitoringSession.pollTimer = setInterval(
    pollForTranscriptChanges,
    monitoringOptions.pollIntervalMs
  );

  // 監視セッションを登録
  activeMonitoringSessions.set(conversationId, monitoringSession);

  return true;
}

/**
 * SQLite3データベースからtranscript配列を取得
 */
async function getTranscriptFromDatabase(
  projectPath: string,
  conversationId: string,
  customDbPath?: string
): Promise<TranscriptMessage[] | null> {
  const dbPath =
    customDbPath || path.join(os.homedir(), 'Library/Application Support/amazon-q/data.sqlite3');

  try {
    const db = new Database(dbPath, { readonly: true });

    try {
      const query =
        "SELECT json_extract(value, '$.transcript') as transcript FROM conversations WHERE key = ?";
      const row = db.prepare(query).get(projectPath) as { transcript: string } | undefined;

      if (!row || !row.transcript) {
        return null;
      }

      const transcript = JSON.parse(row.transcript);
      return Array.isArray(transcript) ? transcript : null;
    } finally {
      db.close();
    }
  } catch (error) {
    // データベースアクセスエラー
    return null;
  }
}

/**
 * メッセージ配列からツール使用パターンを検出
 */
function detectToolUsage(
  messages: TranscriptMessage[]
): Array<{ tools: string[]; message: string }> {
  const toolActivities: Array<{ tools: string[]; message: string }> = [];

  for (const message of messages) {
    if (message.role === 'assistant' && message.content) {
      for (const content of message.content) {
        if (content.text) {
          // ツール使用パターンの検出: [Tool uses: tool1, tool2]
          const toolMatches = content.text.match(/\[Tool uses: ([^\]]+)\]/g);
          if (toolMatches) {
            for (const match of toolMatches) {
              const toolsStr = match.replace(/\[Tool uses: /, '').replace(/\]/, '');
              const tools = toolsStr.split(',').map(tool => tool.trim());

              // ツール情報以外のメッセージ部分を抽出
              const cleanMessage = content.text.replace(/\[Tool uses: [^\]]+\]\s*/g, '').trim();

              toolActivities.push({
                tools,
                message: cleanMessage,
              });
            }
          }
        }
      }
    }
  }

  return toolActivities;
}

/**
 * TranscriptMonitor - 静的な監視管理機能
 */
export class TranscriptMonitor {
  /**
   * 指定されたconversation_idが監視中かどうかを確認
   */
  static isMonitoring(conversationId: string): boolean {
    return activeMonitoringSessions.has(conversationId);
  }

  /**
   * 指定されたconversation_idの監視を停止
   */
  static stopMonitoring(conversationId: string): void {
    const monitoringSession = activeMonitoringSessions.get(conversationId);
    if (monitoringSession) {
      // タイマーをクリア
      clearInterval(monitoringSession.pollTimer);
      // 監視セッションを削除
      activeMonitoringSessions.delete(conversationId);
    }
  }

  /**
   * 全ての監視を停止（クリーンアップ用）
   */
  static stopAllMonitoring(): void {
    for (const conversationId of activeMonitoringSessions.keys()) {
      TranscriptMonitor.stopMonitoring(conversationId);
    }
  }

  /**
   * 現在監視中のconversation数を取得
   */
  static getActiveMonitoringCount(): number {
    return activeMonitoringSessions.size;
  }

  /**
   * 監視中のconversation_idリストを取得
   */
  static getActiveConversationIds(): string[] {
    return Array.from(activeMonitoringSessions.keys());
  }
}
