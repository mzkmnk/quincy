import type { QProcessOptions } from '../session-manager/types';

export function buildCommandArgs(command: string, options: QProcessOptions): string[] {
  const args: string[] = [];

  // コマンドを最初に追加（例: chat）
  args.push(...command.split(' ').filter(arg => arg.length > 0));

  // resume指定
  if (options.resume) {
    args.push('--resume');
  }

  return args;
}
