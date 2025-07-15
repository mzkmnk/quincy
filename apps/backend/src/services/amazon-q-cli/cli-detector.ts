import { exec } from 'child_process';
import { promisify } from 'util';
import type { CLICheckResult } from './types';

const execAsync = promisify(exec);

const CLI_CANDIDATES = [
  'q',
  '/usr/local/bin/q',
  '/opt/homebrew/bin/q',
  process.env.HOME + '/.local/bin/q'
].filter(Boolean); // undefined要素を除外

export class CLIDetector {
  private cliPath: string | null = null;
  private cliChecked: boolean = false;

  /**
   * CLIパスが安全かどうかを検証
   */
  private isValidCLIPath(path: string): boolean {
    // 空文字列や未定義をチェック
    if (!path || typeof path !== 'string') {
      return false;
    }

    // 許可されたパスパターンのみ実行を許可
    const allowedPatterns = [
      /^q$/,                                    // PATH内の'q'コマンド
      /^\/usr\/local\/bin\/q$/,                // 標準的なインストール場所
      /^\/opt\/homebrew\/bin\/q$/,             // Apple Silicon Mac
      /^\/home\/[a-zA-Z0-9_-]+\/\.local\/bin\/q$/,  // ユーザーローカル
      new RegExp(`^${process.env.HOME?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/\\.local/bin/q$`) // ホームディレクトリ
    ].filter(Boolean);

    const isAllowed = allowedPatterns.some(pattern => pattern.test(path));
    
    // 危険な文字列をチェック
    const dangerousChars = [';', '&', '|', '`', '$', '(', ')', '{', '}', '[', ']', '<', '>', '"', "'"];
    const hasDangerousChars = dangerousChars.some(char => path.includes(char));
    
    if (hasDangerousChars) {
      console.warn(`🚨 Dangerous characters detected in CLI path: ${path}`);
      return false;
    }

    return isAllowed;
  }

  /**
   * セキュアなCLI実行
   */
  private async executeSecureCLI(cliPath: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
    if (!this.isValidCLIPath(cliPath)) {
      throw new Error(`Invalid CLI path for security reasons: ${cliPath}`);
    }

    // 引数も検証
    const safeArgs = args.filter(arg => {
      // 基本的な引数のみ許可
      return typeof arg === 'string' && arg.length < 100 && !/[;|&`$()]/.test(arg);
    });

    if (safeArgs.length !== args.length) {
      throw new Error('Invalid arguments detected for security reasons');
    }

    return execAsync(`"${cliPath}" ${safeArgs.join(' ')}`, { timeout: 5000 });
  }

  async checkCLIAvailability(): Promise<CLICheckResult> {
    if (this.cliChecked && this.cliPath) {
      return { available: true, path: this.cliPath };
    }

    console.log('🔍 Checking Amazon Q CLI availability...');
    console.log(`📂 Current PATH: ${process.env.PATH?.substring(0, 200)}...`); // PATH情報を制限
    console.log(`📍 Current working directory: ${process.cwd()}`);

    // 候補パスを順番にチェック
    for (const candidate of CLI_CANDIDATES) {
      if (!this.isValidCLIPath(candidate)) {
        console.log(`🚨 Skipping invalid CLI path: ${candidate}`);
        continue;
      }

      try {
        console.log(`🔍 Trying CLI candidate: ${candidate}`);
        const { stdout, stderr } = await this.executeSecureCLI(candidate, ['--version']);
        
        if (stdout && (stdout.includes('q') || stdout.includes('amazon') || stdout.includes('version'))) {
          console.log(`✅ Found Amazon Q CLI at: ${candidate}`);
          console.log(`📋 Version output: ${stdout.trim().substring(0, 200)}`); // 出力を制限
          this.cliPath = candidate;
          this.cliChecked = true;
          return { available: true, path: candidate };
        }
      } catch (error) {
        console.log(`❌ CLI candidate ${candidate} failed:`, error instanceof Error ? error.message : String(error));
        continue;
      }
    }

    // セキュアなwhichコマンド実行
    try {
      console.log('🔍 Trying with "which q" command...');
      const { stdout } = await execAsync('which q', { timeout: 5000 });
      if (stdout.trim()) {
        const path = stdout.trim();
        // whichの結果も検証
        if (this.isValidCLIPath(path)) {
          console.log(`✅ Found Amazon Q CLI via which: ${path}`);
          this.cliPath = path;
          this.cliChecked = true;
          return { available: true, path };
        } else {
          console.warn(`🚨 which command returned invalid path: ${path}`);
        }
      }
    } catch (error) {
      console.log('❌ "which q" failed:', error instanceof Error ? error.message : String(error));
    }

    const errorMsg = `Amazon Q CLI not found. Please install Amazon Q CLI and ensure 'q' command is available in PATH. Tried paths: ${CLI_CANDIDATES.join(', ')}`;
    console.error(`❌ ${errorMsg}`);
    this.cliChecked = true;
    
    return { 
      available: false, 
      error: errorMsg
    };
  }

  getCLIPath(): string | null {
    return this.cliPath;
  }

  getCLICommand(): string {
    return process.env.AMAZON_Q_CLI_PATH || 'q';
  }
}