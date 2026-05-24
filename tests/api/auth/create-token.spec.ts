import { apiTest as test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { ENV } from '@config/env.config';

test.describe('@smoke @auth Restful-Booker /auth', () => {
  test('TC_API_AUTH_001: valid credentials issue a token', async ({ authApi }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Auth',
      story: 'Create token',
      severity: Severity.CRITICAL,
      testId: 'TC_API_AUTH_001',
      tags: ['@smoke', '@auth'],
    });
    const response = await authApi.createToken({
      username: ENV.RB_USER,
      password: ENV.RB_PASSWORD,
    });
    await authApi.verifyTokenIssued(response);
  });

  test('TC_API_AUTH_002: invalid credentials return Bad credentials', async ({ authApi }) => {
    await setTestMetadata({
      feature: 'Restful-Booker — Auth',
      story: 'Create token — invalid',
      severity: Severity.NORMAL,
      testId: 'TC_API_AUTH_002',
      tags: ['@smoke', '@auth'],
    });
    const response = await authApi.createToken({ username: 'wrong', password: 'wrong' });
    await authApi.verifyBadCredentials(response);
  });
});
