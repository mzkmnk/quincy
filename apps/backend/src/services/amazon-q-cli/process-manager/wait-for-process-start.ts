import { ChildProcess } from 'child_process';

export async function waitForProcessStart(process: ChildProcess): Promise<void> {
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