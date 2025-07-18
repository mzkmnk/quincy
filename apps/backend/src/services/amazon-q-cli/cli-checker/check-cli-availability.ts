import { promisify } from 'util';
import { exec } from 'child_process';
import { checkCLIAvailability } from '../../../utils/cli-validator';

const execAsync = promisify(exec);

export async function checkCLIAvailabilityService(): Promise<{ available: boolean; path?: string; error?: string }> {
  return await checkCLIAvailability();
}