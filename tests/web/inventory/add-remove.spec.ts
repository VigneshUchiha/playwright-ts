import { test } from '@/fixtures';
import { setTestMetadata, Severity } from '@/utils/allureUtils';
import { testDataManager } from '@/utils/testDataManager';
import type { WebUserRow } from '../types';

const BACKPACK = 'Sauce Labs Backpack';
const BIKE_LIGHT = 'Sauce Labs Bike Light';

test.describe('@regression @inventory SauceDemo cart add/remove', () => {
  test.beforeEach(async ({ loginPage }) => {
    const row = testDataManager.getByTcId<WebUserRow>('web_users', 'TC_WEB_AUTH_001');
    await loginPage.open();
    await loginPage.signIn(row.user, row.password);
  });

  test('TC_WEB_INV_001: add two items → badge=2', async ({ inventoryPage }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Inventory',
      story: 'Add to cart',
      severity: Severity.CRITICAL,
      testId: 'TC_WEB_INV_001',
      tags: ['@regression', '@inventory'],
    });
    await inventoryPage.verifyOnInventory();
    await inventoryPage.verifyCartBadge(0);
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await inventoryPage.verifyCartBadge(2);
  });

  test('TC_WEB_INV_002: remove one item → badge=1', async ({ inventoryPage }) => {
    await setTestMetadata({
      feature: 'SauceDemo — Inventory',
      story: 'Remove from cart',
      severity: Severity.NORMAL,
      testId: 'TC_WEB_INV_002',
      tags: ['@regression', '@inventory'],
    });
    await inventoryPage.verifyOnInventory();
    await inventoryPage.addToCart(BACKPACK);
    await inventoryPage.addToCart(BIKE_LIGHT);
    await inventoryPage.removeFromCart(BACKPACK);
    await inventoryPage.verifyCartBadge(1);
  });
});
