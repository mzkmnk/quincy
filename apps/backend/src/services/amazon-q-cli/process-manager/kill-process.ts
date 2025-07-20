import { ChildProcess } from 'child_process';

export function killProcess(process: ChildProcess): void {
  if (!process.killed) {
    process.kill('SIGTERM');

    // SIGTERM後、一定時間待ってもプロセスが終了しない場合はSIGKILL
    setTimeout(() => {
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }, 5000);
  }
}
