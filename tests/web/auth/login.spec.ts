import { test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { testDataManager } from '@/utils/testDataManager';
import type { WebUserRow } from '../types';

test.describe('@smoke @auth SauceDemo login', () => {
  test('TC_WEB_AUTH_001: standard_user signs in and lands on inventory', async ({
    loginPage,
    inventoryPage,
  }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Auth',
      story: 'Login — standard user',
      severity: Severity.CRITICAL,
      testId: 'TC_WEB_AUTH_001',
      tags: ['@smoke', '@auth'],
    });
    const row = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_001');
    await loginPage.open();
    await loginPage.signIn(row.user, row.password);
    await inventoryPage.verifyOnInventory();
  });

  test('TC_WEB_AUTH_002: locked_out_user sees lockout error', async ({ loginPage }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Auth',
      story: 'Login — locked out',
      severity: Severity.NORMAL,
      testId: 'TC_WEB_AUTH_002',
      tags: ['@smoke', '@auth'],
    });
    const row = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_002');
    await loginPage.open();
    await loginPage.signIn(row.user, row.password);
    await loginPage.verifyLoginError(row.expectedError!);
  });

  test('TC_WEB_AUTH_003: wrong password shows credential error', async ({ loginPage }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Auth',
      story: 'Login — bad password',
      severity: Severity.NORMAL,
      testId: 'TC_WEB_AUTH_003',
      tags: ['@smoke', '@auth'],
    });
    const row = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_003');
    await loginPage.open();
    await loginPage.signIn(row.user, row.password);
    await loginPage.verifyLoginError(row.expectedError!);
  });
});
