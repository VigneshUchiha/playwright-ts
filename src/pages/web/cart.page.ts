import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CartPage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#cart_contents_container');
  }

  private get checkoutButton(): Locator {
    return this.page.locator('[data-test="checkout"]');
  }

  private get continueShoppingButton(): Locator {
    return this.page.locator('[data-test="continue-shopping"]');
  }

  private cartItem(name: string): Locator {
    return this.page.locator('[data-test="inventory-item"]').filter({ hasText: name });
  }

  // Slug logic mirrors InventoryPage — see that file for caveats.
  private removeByName(name: string): Locator {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async checkout(): Promise<void> {
    await this.step('Click checkout', async () => {
      await this.ui.click(this.checkoutButton, 'Checkout button');
    });
  }

  async removeItem(productName: string): Promise<void> {
    await this.step(`Remove "${productName}" from cart`, async () => {
      await this.ui.click(this.removeByName(productName), `Remove ${productName}`);
    });
  }

  async continueShopping(): Promise<void> {
    await this.step('Continue shopping', async () => {
      await this.ui.click(this.continueShoppingButton, 'Continue shopping');
    });
  }

  async verifyOnCart(): Promise<void> {
    await this.verifyOnPage();
  }

  async verifyItem(productName: string): Promise<void> {
    await this.step(`Verify "${productName}" in cart`, async () => {
      await this.ui.expectVisible(this.cartItem(productName), productName);
    });
  }
}
