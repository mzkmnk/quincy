import { AmazonQCLIService } from '../services/amazon-q-cli';
import { generateMessageId, generateSessionId } from '../utils/id-generator';
import { stripAnsiCodes } from '../utils/ansi-stripper';
import { validateProjectPath } from '../utils/path-validator';
import { checkCLIAvailability } from '../utils/cli-validator';

describe('Performance Tests', () => {
  let service: AmazonQCLIService;

  beforeEach(() => {
    // EventEmitterの最大リスナー数を増加
    process.setMaxListeners(50);
    service = new AmazonQCLIService();
    service.setMaxListeners(50);
  });

  afterEach(async (): Promise<void> => {
    await service.terminateAllSessions();
    service.removeAllListeners();
    // プロセスのリスナー数をリセット
    process.setMaxListeners(10);
  });

  describe('ID生成パフォーマンス', () => {
    it('大量のメッセージID生成が高速に実行されること', () => {
      const startTime = performance.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        generateMessageId();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Generated ${iterations} message IDs in ${duration.toFixed(2)}ms`);

      // 1万回の生成が100ms以下で完了すること
      expect(duration).toBeLessThan(100);
    });

    it('大量のセッションID生成が高速に実行されること', () => {
      const startTime = performance.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        generateSessionId();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Generated ${iterations} session IDs in ${duration.toFixed(2)}ms`);

      // 1万回の生成が100ms以下で完了すること
      expect(duration).toBeLessThan(100);
    });

    it('ID生成の結果が重複しないこと', () => {
      const iterations = 10000;
      const messageIds = new Set<string>();
      const sessionIds = new Set<string>();

      for (let i = 0; i < iterations; i++) {
        messageIds.add(generateMessageId());
        sessionIds.add(generateSessionId());
      }

      // 重複がないこと
      expect(messageIds.size).toBe(iterations);
      expect(sessionIds.size).toBe(iterations);
    });
  });

  describe('ANSI除去パフォーマンス', () => {
    it('短いテキストのANSI除去が高速に実行されること', () => {
      const text = '\x1b[31mRed text\x1b[0m \x1b[32mGreen text\x1b[0m';
      const startTime = performance.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        stripAnsiCodes(text);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Stripped ANSI codes from ${iterations} short texts in ${duration.toFixed(2)}ms`);

      // 1万回の処理が50ms以下で完了すること
      expect(duration).toBeLessThan(50);
    });

    it('長いテキストのANSI除去が適切な時間で実行されること', () => {
      const longText =
        '\x1b[31m' + 'A'.repeat(10000) + '\x1b[0m \x1b[32m' + 'B'.repeat(10000) + '\x1b[0m';
      const startTime = performance.now();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        stripAnsiCodes(longText);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Stripped ANSI codes from ${iterations} long texts in ${duration.toFixed(2)}ms`);

      // 1000回の処理が1000ms以下で完了すること
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('パス検証パフォーマンス', () => {
    it('有効なパスの検証が高速に実行されること', async () => {
      const validPath = __dirname; // 有効なパス
      const startTime = performance.now();
      const iterations = 100; // 非同期なので減らす

      for (let i = 0; i < iterations; i++) {
        await validateProjectPath(validPath);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Validated ${iterations} valid paths in ${duration.toFixed(2)}ms`);

      // 100回の検証が適切な時間で完了すること
      expect(duration).toBeLessThan(2000);
    });

    it('無効なパスの検証が高速に実行されること', async () => {
      const invalidPath = '/nonexistent/path/to/directory';
      const startTime = performance.now();
      const iterations = 100; // 非同期なので減らす

      for (let i = 0; i < iterations; i++) {
        await validateProjectPath(invalidPath);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Validated ${iterations} invalid paths in ${duration.toFixed(2)}ms`);

      // 100回の検証が適切な時間で完了すること
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('CLI検証パフォーマンス', () => {
    it('CLI利用可能性チェックが適切な時間で実行されること', async () => {
      const startTime = performance.now();
      const iterations = 10; // CLI チェックは重い処理なので少なめに

      for (let i = 0; i < iterations; i++) {
        await checkCLIAvailability();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Checked CLI availability ${iterations} times in ${duration.toFixed(2)}ms`);

      // 10回のチェックが5000ms以下で完了すること
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('サービス初期化パフォーマンス', () => {
    it('Amazon Q CLIサービスの初期化が高速に実行されること', () => {
      const startTime = performance.now();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const testService = new AmazonQCLIService();
        testService.destroy();
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Initialized Amazon Q CLI service ${iterations} times in ${duration.toFixed(2)}ms`
      );

      // 100回の初期化が1000ms以下で完了すること
      expect(duration).toBeLessThan(1000);
    });

    it.skip('WebSocketサービスの初期化が高速に実行されること (requires HTTP server)', () => {
      // WebSocketServiceはHTTPサーバーが必要なため、単体テストではスキップ
      console.log('WebSocketサービスの初期化テストはHTTPサーバーが必要なためスキップしました');
    });
  });

  describe('メモリ使用量テスト', () => {
    it('大量のセッション作成・削除でメモリリークが発生しないこと', async () => {
      const getMemoryUsage = (): number => process.memoryUsage().heapUsed;

      const initialMemory = getMemoryUsage();
      const sessionIds: string[] = [];

      // 無効なパスでテストする（実際のプロセスは起動されない）
      const testPath = '/nonexistent/path';

      // 大量のセッション作成試行（失敗することが期待される）
      for (let i = 0; i < 100; i++) {
        const sessionId = generateSessionId();
        sessionIds.push(sessionId);

        try {
          await service.startSession('help', { workingDir: testPath });
        } catch {
          // エラーは期待される
        }
      }

      // ガベージコレクションを促す
      if (global.gc) {
        global.gc();
      }

      // メモリ使用量を再測定
      const afterMemory = getMemoryUsage();
      const memoryIncrease = afterMemory - initialMemory;

      console.log(`Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`After memory: ${(afterMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

      // メモリ増加が10MB以下であること
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('並行処理パフォーマンス', () => {
    it('複数のID生成が並行して高速に実行されること', async () => {
      const startTime = performance.now();
      const iterations = 1000;

      const promises = [];
      for (let i = 0; i < iterations; i++) {
        promises.push(Promise.resolve(generateMessageId()));
      }

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Generated ${iterations} message IDs concurrently in ${duration.toFixed(2)}ms`);

      // 結果の重複チェック
      const uniqueResults = new Set(results);
      expect(uniqueResults.size).toBe(iterations);

      // 並行実行が100ms以下で完了すること
      expect(duration).toBeLessThan(100);
    });

    it('複数のパス検証が並行して実行されること', async () => {
      const startTime = performance.now();
      const iterations = 50; // 並行処理なので少し減らす

      const promises = [];
      for (let i = 0; i < iterations; i++) {
        promises.push(validateProjectPath(__dirname));
      }

      const results = await Promise.all(promises);

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Validated ${iterations} paths concurrently in ${duration.toFixed(2)}ms`);

      // 全て有効なパスなので全てtrueであること
      results.forEach(result => {
        expect(result.valid).toBe(true);
      });

      // 並行実行が適切な時間で完了すること
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('エラーハンドリングパフォーマンス', () => {
    it('大量のエラーが発生しても処理が継続できること', async () => {
      const startTime = performance.now();
      const iterations = 100; // 非同期なので少し減らす
      let errorCount = 0;
      let successCount = 0;

      for (let i = 0; i < iterations; i++) {
        try {
          // 意図的に無効なパスを渡してエラーを発生させる
          const result = await validateProjectPath('');
          if (!result.valid) {
            errorCount++;
          } else {
            successCount++;
          }
        } catch {
          errorCount++;
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(
        `Handled ${errorCount} errors and ${successCount} successes in ${duration.toFixed(2)}ms`
      );

      // 全てエラーになることが期待される（validateProjectPathは例外を投げずにresultを返す）
      expect(errorCount).toBe(iterations);

      // エラーハンドリングが適切な時間で完了すること
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('型チェックパフォーマンス', () => {
    it('大量の型チェックが高速に実行されること', () => {
      const startTime = performance.now();
      const iterations = 10000;

      for (let i = 0; i < iterations; i++) {
        const messageId = generateMessageId();
        const sessionId = generateSessionId();

        // 型チェック（実際のTypeScriptでは最適化されるが、実行時チェックをシミュレート）
        const isMessage = messageId.startsWith('msg_');
        const isSession = sessionId.startsWith('q_session_');

        expect(isMessage).toBe(true);
        expect(isSession).toBe(true);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Performed ${iterations} type checks in ${duration.toFixed(2)}ms`);

      // 型チェックが500ms以下で完了すること（実際の環境では最適化される）
      expect(duration).toBeLessThan(500);
    });
  });

  describe('関数呼び出しオーバーヘッド', () => {
    it('小さな関数の呼び出しオーバーヘッドが最小限であること', () => {
      const startTime = performance.now();
      const iterations = 100000;

      // 小さな関数を大量に呼び出す
      for (let i = 0; i < iterations; i++) {
        stripAnsiCodes('test');
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Called stripAnsiCodes ${iterations} times in ${duration.toFixed(2)}ms`);

      // 10万回の呼び出しが500ms以下で完了すること
      expect(duration).toBeLessThan(500);
    });
  });
});
