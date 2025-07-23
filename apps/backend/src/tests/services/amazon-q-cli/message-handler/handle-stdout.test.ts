import type { ChildProcess } from 'child_process';

import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { QResponseEvent } from '@quincy/shared';

import { handleStdout } from '../../../../services/amazon-q-cli/message-handler/handle-stdout';
import type { QProcessSession, QProcessOptions, AbsolutePath } from '../../../../types';
import { ToolDetectionBuffer } from '../../../../services/amazon-q-message-parser';
import { ParagraphProcessor } from '../../../../services/amazon-q-cli/message-handler';

describe('handleStdout - ツール検出機能', () => {
  let mockSession: QProcessSession;
  let mockEmitCallback: ReturnType<typeof vi.fn<(event: string, data: QResponseEvent) => void>>;
  let mockFlushCallback: ReturnType<typeof vi.fn<(session: QProcessSession) => void>>;

  beforeEach(() => {
    const mockProcess = {
      pid: 123,
      connected: false,
      stdin: null,
      stdout: null,
      stderr: null,
      stdio: [null, null, null, null, null],
      killed: false,
      exitCode: null,
      signalCode: null,
      spawnargs: [],
      spawnfile: '',
      kill: vi.fn().mockReturnValue(true),
      send: vi.fn().mockReturnValue(true),
      disconnect: vi.fn(),
      unref: vi.fn(),
      ref: vi.fn(),
      addListener: vi.fn(),
      emit: vi.fn(),
      eventNames: vi.fn(),
      getMaxListeners: vi.fn(),
      listenerCount: vi.fn(),
      listeners: vi.fn(),
      off: vi.fn(),
      on: vi.fn(),
      once: vi.fn(),
      prependListener: vi.fn(),
      prependOnceListener: vi.fn(),
      rawListeners: vi.fn(),
      removeAllListeners: vi.fn(),
      removeListener: vi.fn(),
      setMaxListeners: vi.fn(),
      [Symbol.dispose]: vi.fn(),
    } as ChildProcess;

    const mockOptions: QProcessOptions = {
      workingDir: '/test' as AbsolutePath,
      timeout: 30000,
    };

    mockSession = {
      sessionId: 'q_session_123',
      process: mockProcess,
      workingDir: '/test',
      startTime: Date.now(),
      status: 'running',
      lastActivity: Date.now(),
      pid: 123,
      command: 'test',
      options: mockOptions,
      outputBuffer: '',
      errorBuffer: '',
      bufferFlushCount: 0,
      incompleteOutputLine: '',
      incompleteErrorLine: '',
      lastInfoMessage: '',
      lastInfoMessageTime: 0,
      lastThinkingMessage: '',
      hasThinkingSent: false,
      initializationBuffer: [],
      initializationPhase: false,
      currentTools: [],
      toolBuffer: '',
      toolDetectionBuffer: new ToolDetectionBuffer(),
      paragraphProcessor: new ParagraphProcessor(),
    };

    mockEmitCallback = vi.fn();
    mockFlushCallback = vi.fn();
  });

  describe('TDD Red: ツール検出機能のテスト', () => {
    test('ツール使用行を検出してツール情報を含むレスポンスイベントを発行する', () => {
      const data = Buffer.from('🛠️ Using tool: fs_read\n');

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      // ツール検出後の期待される動作
      expect(mockSession.currentTools).toEqual(['fs_read']);
      // ツール行のみの場合はクリーンな行が空なのでレスポンスイベントは発行されない
      expect(mockEmitCallback).not.toHaveBeenCalled();
    });

    test('(trusted)付きツールを正しく処理する', () => {
      const data = Buffer.from('🛠️ Using tool: fs_read (trusted)\n');

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      expect(mockSession.currentTools).toEqual(['fs_read']);
      // ツール行のみの場合はクリーンな行が空なのでレスポンスイベントは発行されない
      expect(mockEmitCallback).not.toHaveBeenCalled();
    });

    test('ツール行とテキストが混在する場合', () => {
      const data = Buffer.from(
        'ファイルを確認します🛠️ Using tool: fs_read\n結果をお知らせします\n'
      );

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      expect(mockSession.currentTools).toEqual(['fs_read']);

      // 2つのレスポンスイベントが発行される
      expect(mockEmitCallback).toHaveBeenCalledTimes(2);

      // 1つ目: ツール検出されたクリーンな行
      expect(mockEmitCallback).toHaveBeenNthCalledWith(1, 'q:response', {
        sessionId: 'q_session_123',
        data: 'ファイルを確認します\n',
        type: 'stream',
        tools: ['fs_read'],
        hasToolContent: true,
      });

      // 2つ目: 通常のテキスト行
      expect(mockEmitCallback).toHaveBeenNthCalledWith(2, 'q:response', {
        sessionId: 'q_session_123',
        data: '結果をお知らせします\n',
        type: 'stream',
        tools: ['fs_read'], // セッションに蓄積されたツール情報
        hasToolContent: true,
      });
    });

    test('ツールなしの通常行を処理する', () => {
      const data = Buffer.from('通常のAI応答です\n');

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      expect(mockSession.currentTools).toEqual([]);
      expect(mockEmitCallback).toHaveBeenCalledWith('q:response', {
        sessionId: 'q_session_123',
        data: '通常のAI応答です\n',
        type: 'stream',
        tools: [],
        hasToolContent: false,
      });
    });

    test('セッションに既存ツールがある場合、累積される', () => {
      // 事前にツールを設定
      mockSession.currentTools = ['existing_tool'];

      const data = Buffer.from('🛠️ Using tool: fs_read\n');

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      expect(mockSession.currentTools).toEqual(['existing_tool', 'fs_read']);
      // ツール行のみの場合はクリーンな行が空なのでレスポンスイベントは発行されない
      expect(mockEmitCallback).not.toHaveBeenCalled();
    });

    test('ツール行をスキップして表示しない機能', () => {
      const data = Buffer.from('前の行\n🛠️ Using tool: fs_read\n後の行\n');

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      // ツール行はスキップされ、前後の行のみが処理される
      expect(mockEmitCallback).toHaveBeenCalledTimes(2);

      expect(mockEmitCallback).toHaveBeenNthCalledWith(
        1,
        'q:response',
        expect.objectContaining({
          data: '前の行\n',
        })
      );

      expect(mockEmitCallback).toHaveBeenNthCalledWith(
        2,
        'q:response',
        expect.objectContaining({
          data: '後の行\n',
        })
      );
    });

    test('空のツール名や不正なツール行を適切に処理する', () => {
      const data = Buffer.from('🛠️ Using tool: \n🛠️ Using tool: fs_read\n不正なUsing tool形式\n');

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      // 有効なツールのみが抽出される
      expect(mockSession.currentTools).toEqual(['fs_read']);

      // 不正なツール行も通常行として処理される
      expect(mockEmitCallback).toHaveBeenCalledWith(
        'q:response',
        expect.objectContaining({
          data: '不正なUsing tool形式\n',
        })
      );
    });
  });

  describe('TDD Red: 既存機能との統合テスト', () => {
    test('初期化フェーズ中のツール検出', () => {
      mockSession.initializationPhase = true;

      const data = Buffer.from('🛠️ Using tool: fs_read\n初期化メッセージ\n');

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      // 初期化フェーズ中でもツール検出は動作する
      expect(mockSession.currentTools).toEqual(['fs_read']);
    });

    test('Thinkingメッセージとツール検出の組み合わせ', () => {
      const data = Buffer.from('Thinking...\n🛠️ Using tool: fs_read\n');

      handleStdout(mockSession, data, mockEmitCallback, mockFlushCallback);

      expect(mockSession.currentTools).toEqual(['fs_read']);
      // Thinkingメッセージは完全にスキップされる
      expect(mockEmitCallback).toHaveBeenCalledTimes(0); // ツール検出のみ、Thinkingはスキップ
    });
  });
});
