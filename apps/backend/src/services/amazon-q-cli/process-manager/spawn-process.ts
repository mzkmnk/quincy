import { spawn, ChildProcess } from 'child_process';

export function spawnProcess(cliCommand: string, args: string[], workingDir: string): ChildProcess {
  return spawn(cliCommand, args, {
    cwd: workingDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      // Amazon Q CLI用の環境変数設定
      AWS_PAGER: '',
      NO_COLOR: '1',
    },
  });
}
