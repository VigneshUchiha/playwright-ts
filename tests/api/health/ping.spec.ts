import { apiTest as test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';

test.describe('@smoke @health Restful-Booker /ping', () => {
  test('TC_API_HEALTH_001: GET /ping returns 201', async ({ healthApi }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Health',
      story: 'Service availability',
      severity: Severity.CRITICAL,
      testId: 'TC_API_HEALTH_001',
      tags: ['@smoke', '@health'],
    });
    const response = await healthApi.ping();
    await healthApi.verifyPingOk(response);
  });
});
