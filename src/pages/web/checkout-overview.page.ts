import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutOverviewPage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#checkout_summary_container');
  }

  private get itemSubtotalLabel(): Locator {
    return this.page.locator('[data-test="subtotal-label"]');
  }

  private get taxLabel(): Locator {
    return this.page.locator('[data-test="tax-label"]');
  }

  private get totalLabel(): Locator {
    return this.page.locator('[data-test="total-label"]');
  }

  private get finishButton(): Locator {
    return this.page.locator('[data-test="finish"]');
  }

  private get cancelButton(): Locator {
    return this.container.locator('[data-test="cancel"]');
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async finish(): Promise<void> {
    await this.step('Click finish', async () => {
      await this.ui.click(this.finishButton, 'Finish');
    });
  }

  async cancel(): Promise<void> {
    await this.step('Click cancel', async () => {
      await this.ui.click(this.cancelButton, 'Cancel (overview)');
    });
  }

  async verifyOnOverview(): Promise<void> {
    await this.verifyOnPage();
    await this.ui.expectVisible(this.itemSubtotalLabel, 'Item subtotal');
    await this.ui.expectVisible(this.taxLabel, 'Tax');
    await this.ui.expectVisible(this.totalLabel, 'Total');
  }
}
