import { spawn, ChildProcess } from 'child_process';
import type { QProcessOptions } from './types';

export class ProcessManager {
  /**
   * コマンドライン引数を構築
   */
  buildCommandArgs(command: string, options: QProcessOptions): string[] {
    const args: string[] = [];
    
    // コマンドを最初に追加（例: chat）
    args.push(...command.split(' ').filter(arg => arg.length > 0));
    
    // resume指定
    if (options.resume) {
      console.log('📋 Resume option detected, adding --resume flag');
      args.push('--resume');
    }
    
    return args;
  }

  /**
   * プロセスを起動
   */
  spawnProcess(cliCommand: string, args: string[], workingDir: string): ChildProcess {
    console.log(`🚀 Starting Amazon Q CLI session with command: ${cliCommand}`);
    console.log(`📂 Working directory: ${workingDir}`);
    console.log(`📋 CLI arguments: ${args.join(' ')}`);
    
    return spawn(cliCommand, args, {
      cwd: workingDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Amazon Q CLI用の環境変数設定
        AWS_PAGER: '',
        NO_COLOR: '1'
      }
    });
  }

  /**
   * プロセス起動の確認を待つ
   */
  async waitForProcessStart(process: ChildProcess): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Process start timeout'));
      }, 30000); // 30秒でタイムアウト

      process.on('spawn', () => {
        clearTimeout(timeout);
        resolve();
      });

      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * プロセスを強制終了
   */
  killProcess(process: ChildProcess, signal: NodeJS.Signals = 'SIGTERM'): void {
    if (!process.killed) {
      process.kill(signal);
      
      // SIGTERM後、一定時間待ってもプロセスが終了しない場合はSIGKILL
      if (signal === 'SIGTERM') {
        setTimeout(() => {
          if (!process.killed) {
            process.kill('SIGKILL');
          }
        }, 5000);
      }
    }
  }

  /**
   * プロセスへの入力送信
   */
  sendInput(process: ChildProcess, input: string): boolean {
    if (process.stdin && !process.stdin.destroyed) {
      process.stdin.write(input);
      console.log(`✅ Input sent to process: ${input.trim()}`);
      return true;
    } else {
      console.error('Process stdin is not available');
      return false;
    }
  }
}