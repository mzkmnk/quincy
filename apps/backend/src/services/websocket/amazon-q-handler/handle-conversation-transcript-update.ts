/**
 * conversation transcript更新ハンドラー
 * conversation_id追跡とtranscript監視を統合し、WebSocketイベントとして通知
 */

import { Server as SocketIOServer } from 'socket.io';

import {
  trackActiveConversation,
  monitorConversationTranscript,
  ConversationTracker,
  TranscriptMonitor,
} from '../../amazon-q-history';
import type { QProcessSession } from '../../amazon-q-cli/session-manager/types';
import type {
  ConversationReadyEventData,
  ConversationTranscriptUpdateEventData,
  ConversationToolActivityEventData,
  ConversationTimeoutEventData,
} from '../../../types/websocket';

// アクティブなハンドリングセッション管理
const activeHandlingSessions = new Map<string, HandlingSession>();

interface HandlingSession {
  sessionId: string;
  projectPath: string;
  roomId: string;
  startTime: Date;
  conversationId?: string;
  isTrackingActive: boolean;
  isMonitoringActive: boolean;
}

/**
 * conversation関連イベントの統合ハンドリングを開始
 * @param io - Socket.IOサーバーインスタンス
 * @param session - Amazon Q CLIセッション
 * @param roomId - WebSocketルームID
 * @returns ハンドリング開始の成功/失敗
 */
export async function handleConversationTranscriptUpdate(
  io: SocketIOServer,
  session: QProcessSession,
  roomId: string
): Promise<boolean> {
  // 既にハンドリング中の場合は重複処理を拒否
  if (activeHandlingSessions.has(session.sessionId)) {
    return false;
  }

  const handlingSession: HandlingSession = {
    sessionId: session.sessionId,
    projectPath: session.projectPath,
    roomId,
    startTime: new Date(),
    isTrackingActive: false,
    isMonitoringActive: false,
  };

  // conversation_id追跡を開始
  try {
    const trackingResult = await trackActiveConversation(
      session,
      (event: string, data: any) =>
        handleConversationEvents(io, roomId, event, data, handlingSession),
      undefined, // customDbPath
      { timeoutMs: 30000, pollIntervalMs: 1000 }
    );

    if (trackingResult) {
      handlingSession.isTrackingActive = true;
    }
  } catch (error) {
    console.error('conversation追跡開始エラー:', error);
    // エラーでも継続
  }

  // ハンドリングセッションを登録
  activeHandlingSessions.set(session.sessionId, handlingSession);

  return true;
}

/**
 * conversation関連イベントを処理
 */
async function handleConversationEvents(
  io: SocketIOServer,
  roomId: string,
  event: string,
  data: any,
  handlingSession: HandlingSession
) {
  try {
    switch (event) {
      case 'conversation:ready':
        await handleConversationReadyInternal(io, roomId, data, handlingSession);
        break;
      case 'conversation:transcript-update':
        emitToRoom(io, roomId, 'conversation:transcript-update', data);
        break;
      case 'conversation:tool-activity':
        emitToRoom(io, roomId, 'conversation:tool-activity', data);
        break;
      case 'conversation:timeout':
        emitToRoom(io, roomId, 'conversation:timeout', data);
        break;
      default:
        console.warn('未知のconversationイベント:', event);
    }
  } catch (error) {
    console.error('conversationイベント処理エラー:', error);
  }
}

/**
 * conversation:readyイベントの内部処理
 */
async function handleConversationReadyInternal(
  io: SocketIOServer,
  roomId: string,
  data: ConversationReadyEventData,
  handlingSession: HandlingSession
) {
  // conversation_idを保存
  handlingSession.conversationId = data.conversationId;

  // WebSocketイベントを発火
  emitToRoom(io, roomId, 'conversation:ready', data);

  // transcript監視を開始
  try {
    const monitoringResult = await monitorConversationTranscript(
      data.conversationId,
      data.projectPath,
      (event: string, eventData: any) =>
        handleConversationEvents(io, roomId, event, eventData, handlingSession),
      undefined, // customDbPath
      { timeoutMs: 300000, pollIntervalMs: 2000 }
    );

    if (monitoringResult) {
      handlingSession.isMonitoringActive = true;
    }
  } catch (error) {
    console.error('transcript監視開始エラー:', error);
  }
}

/**
 * Socket.IOルームにイベントを発火
 */
function emitToRoom(io: SocketIOServer, roomId: string, event: string, data: any) {
  try {
    io.to(roomId).emit(event, data);
  } catch (error) {
    console.error('WebSocketイベント発火エラー:', error);
  }
}

/**
 * ConversationHandler - 静的なハンドリング管理機能
 */
export class ConversationHandler {
  /**
   * 指定されたセッションがハンドリング中かどうかを確認
   */
  static isHandling(sessionId: string): boolean {
    return activeHandlingSessions.has(sessionId);
  }

  /**
   * 指定されたセッションのハンドリングを停止
   */
  static stopHandling(sessionId: string): void {
    const handlingSession = activeHandlingSessions.get(sessionId);
    if (handlingSession) {
      // conversation_id追跡を停止
      if (handlingSession.isTrackingActive) {
        ConversationTracker.stopTracking(sessionId);
      }

      // transcript監視を停止
      if (handlingSession.isMonitoringActive && handlingSession.conversationId) {
        TranscriptMonitor.stopMonitoring(handlingSession.conversationId);
      }

      // ハンドリングセッションを削除
      activeHandlingSessions.delete(sessionId);
    }
  }

  /**
   * 全てのハンドリングを停止（クリーンアップ用）
   */
  static stopAllHandling(): void {
    for (const sessionId of activeHandlingSessions.keys()) {
      ConversationHandler.stopHandling(sessionId);
    }
  }

  /**
   * 現在ハンドリング中のセッション数を取得
   */
  static getActiveHandlingCount(): number {
    return activeHandlingSessions.size;
  }

  /**
   * ハンドリング中のセッションIDリストを取得
   */
  static getActiveSessionIds(): string[] {
    return Array.from(activeHandlingSessions.keys());
  }

  /**
   * 指定されたセッションのconversation_idを設定（テスト用）
   */
  static setConversationId(sessionId: string, conversationId: string): void {
    const handlingSession = activeHandlingSessions.get(sessionId);
    if (handlingSession) {
      handlingSession.conversationId = conversationId;
    }
  }

  /**
   * 指定されたセッションのハンドリングセッションを取得（テスト用）
   */
  static getHandlingSession(sessionId: string): HandlingSession | undefined {
    return activeHandlingSessions.get(sessionId);
  }

  /**
   * conversation:readyイベントの手動処理（テスト用）
   */
  static async handleConversationReady(
    data: ConversationReadyEventData,
    roomId: string
  ): Promise<void> {
    const handlingSession = activeHandlingSessions.get(data.sessionId);
    if (handlingSession) {
      // モック対応のため、ioパラメータを使わない簡略版
      handlingSession.conversationId = data.conversationId;

      // 実際の実装では monitorConversationTranscript を呼び出す
      try {
        await monitorConversationTranscript(
          data.conversationId,
          data.projectPath,
          () => {}, // 空のコールバック
          undefined,
          { timeoutMs: 300000, pollIntervalMs: 2000 }
        );
        handlingSession.isMonitoringActive = true;
      } catch (error) {
        console.error('transcript監視開始エラー:', error);
      }
    }
  }

  /**
   * WebSocketイベント発火（テスト用）
   */
  private static testIO: SocketIOServer | null = null;

  static setTestIO(io: SocketIOServer): void {
    ConversationHandler.testIO = io;
  }

  static emitConversationReady(roomId: string, data: ConversationReadyEventData): void {
    if (ConversationHandler.testIO) {
      emitToRoom(ConversationHandler.testIO, roomId, 'conversation:ready', data);
    } else {
      console.log(`Emitting conversation:ready to room ${roomId}:`, data);
    }
  }

  static emitTranscriptUpdate(roomId: string, data: ConversationTranscriptUpdateEventData): void {
    if (ConversationHandler.testIO) {
      emitToRoom(ConversationHandler.testIO, roomId, 'conversation:transcript-update', data);
    } else {
      console.log(`Emitting conversation:transcript-update to room ${roomId}:`, data);
    }
  }

  static emitToolActivity(roomId: string, data: ConversationToolActivityEventData): void {
    if (ConversationHandler.testIO) {
      emitToRoom(ConversationHandler.testIO, roomId, 'conversation:tool-activity', data);
    } else {
      console.log(`Emitting conversation:tool-activity to room ${roomId}:`, data);
    }
  }

  static emitTimeout(roomId: string, data: ConversationTimeoutEventData): void {
    if (ConversationHandler.testIO) {
      emitToRoom(ConversationHandler.testIO, roomId, 'conversation:timeout', data);
    } else {
      console.log(`Emitting conversation:timeout to room ${roomId}:`, data);
    }
  }
}
