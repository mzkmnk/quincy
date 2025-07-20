import { checkCLIAvailability } from '../../../utils/cli-validator';

export async function checkCLIAvailabilityService(): Promise<{
  available: boolean;
  path?: string;
  error?: string;
}> {
  return await checkCLIAvailability();
}
