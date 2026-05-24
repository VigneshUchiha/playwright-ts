import { test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { testDataManager } from '@/utils/testDataManager';
import type { WebUserRow, WebCheckoutRow } from '../types';

const BACKPACK = 'Sauce Labs Backpack';

test.describe('@smoke @e2e SauceDemo end-to-end checkout', () => {
  test('TC_WEB_E2E_001: login → add → cart → info → overview → complete', async ({
    loginPage,
    inventoryPage,
    cartPage,
    checkoutInfoPage,
    checkoutOverviewPage,
    checkoutCompletePage,
  }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Checkout',
      story: 'End-to-end happy path',
      severity: Severity.CRITICAL,
      testId: 'TC_WEB_E2E_001',
      tags: ['@smoke', '@e2e'],
    });

    const user = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_001');
    const form = testDataManager.getByTcId<WebCheckoutRow>('web_checkout', 'TC_WEB_E2E_001');

    await loginPage.open();
    await loginPage.signIn(user.user, user.password);

    await inventoryPage.verifyOnInventory();
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.verifyCartBadge(1);
    await inventoryPage.openCart();

    await cartPage.verifyOnCart();
    await cartPage.verifyItem(BACKPACK);
    await cartPage.checkout();

    await checkoutInfoPage.verifyOnInfo();
    await checkoutInfoPage.enterCustomerInfo({
      firstName: form.firstName,
      lastName: form.lastName,
      postalCode: form.postalCode,
    });
    await checkoutInfoPage.continue();

    await checkoutOverviewPage.verifyOnOverview();
    await checkoutOverviewPage.finish();

    await checkoutCompletePage.verifyOrderComplete();
  });
});
