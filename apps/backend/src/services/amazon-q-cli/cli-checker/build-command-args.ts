import type { QProcessOptions } from '../session-manager/types';

export function buildCommandArgs(command: string, options: QProcessOptions): string[] {
  const args: string[] = [];

  // オプション引数を先に追加
  // model指定
  if (options.model) {
    args.push('--model', options.model);
  }

  // resume指定
  if (options.resume) {
    args.push('--resume');
  }

  // コマンドを最後に追加（例: chat）
  args.push(...command.split(' ').filter(arg => arg.length > 0));

  return args;
}
