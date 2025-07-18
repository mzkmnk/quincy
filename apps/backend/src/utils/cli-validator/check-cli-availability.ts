/**
 * CLI 可用性チェックユーティリティ
 */

import { promisify } from 'util';
import { exec } from 'child_process';
import { isValidCLIPath, getCLICandidates } from './validate-cli-path';

const execAsync = promisify(exec);

export interface CLIAvailabilityResult {
  available: boolean;
  path?: string;
  error?: string;
}

/**
 * セキュアなCLI実行
 * @param cliPath CLIパス
 * @param args 引数の配列
 * @returns 実行結果
 */
async function executeSecureCLI(cliPath: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  // 引数をサニタイズ（シェルインジェクション対策）
  const safeArgs = args.map(arg => 
    arg.replace(/[;&|`$(){}[\]<>"'\\]/g, '\\$&')
  );
  
  return execAsync(`"${cliPath}" ${safeArgs.join(' ')}`, { timeout: 5000 });
}

/**
 * Amazon Q CLIの可用性をチェック
 * @returns チェック結果
 */
export async function checkCLIAvailability(): Promise<CLIAvailabilityResult> {
  const cliCandidates = getCLICandidates();

  // 候補パスを順番にチェック
  for (const candidate of cliCandidates) {
    if (!isValidCLIPath(candidate)) {
      continue;
    }

    try {
      const { stdout } = await executeSecureCLI(candidate, ['--version']);
      
      if (stdout && (stdout.includes('q') || stdout.includes('amazon') || stdout.includes('version'))) {
        return { available: true, path: candidate };
      }
    } catch (error) {
      continue;
    }
  }

  // セキュアなwhichコマンド実行
  try {
    const { stdout } = await execAsync('which q', { timeout: 5000 });
    if (stdout.trim()) {
      const path = stdout.trim();
      // whichの結果も検証
      if (isValidCLIPath(path)) {
        return { available: true, path };
      }
    }
  } catch (error) {
    // エラーは無視して続行
  }

  const errorMsg = `Amazon Q CLI not found. Please install Amazon Q CLI and ensure 'q' command is available in PATH. Tried paths: ${cliCandidates.join(', ')}`;
  return { available: false, error: errorMsg };
}