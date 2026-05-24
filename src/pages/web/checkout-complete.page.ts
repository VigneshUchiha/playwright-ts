import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class CheckoutCompletePage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#checkout_complete_container');
  }

  private get completeHeader(): Locator {
    return this.page.locator('[data-test="complete-header"]');
  }

  private get completeText(): Locator {
    return this.page.locator('[data-test="complete-text"]');
  }

  private get ponyExpressImage(): Locator {
    return this.page.locator('[data-test="pony-express"]');
  }

  private get backHomeButton(): Locator {
    return this.page.locator('[data-test="back-to-products"]');
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async backHome(): Promise<void> {
    await this.step('Click back home', async () => {
      await this.ui.click(this.backHomeButton, 'Back home');
    });
  }

  async verifyOrderComplete(): Promise<void> {
    await this.verifyOnPage();
    await this.ui.expectText(this.completeHeader, 'Thank you for your order!', 'Complete header');
    await this.ui.expectVisible(this.completeText, 'Complete description');
    await this.ui.expectVisible(this.ponyExpressImage, 'Pony Express image');
    await this.ui.expectVisible(this.backHomeButton, 'Back-home button');
  }
}
