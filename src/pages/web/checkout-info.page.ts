import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export interface CustomerForm {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export class CheckoutInfoPage extends BasePage {
  private get container(): Locator {
    return this.page.locator('#checkout_info_container');
  }

  private get firstNameInput(): Locator {
    return this.page.locator('[data-test="firstName"]');
  }

  private get lastNameInput(): Locator {
    return this.page.locator('[data-test="lastName"]');
  }

  private get postalCodeInput(): Locator {
    return this.page.locator('[data-test="postalCode"]');
  }

  private get continueButton(): Locator {
    return this.page.locator('[data-test="continue"]');
  }

  // Scoped to this page so it doesn't conflict with the overview page's own cancel
  private get cancelButton(): Locator {
    return this.container.locator('[data-test="cancel"]');
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async enterCustomerInfo(form: CustomerForm): Promise<void> {
    await this.step('Enter customer info', async () => {
      await this.ui.fill(this.firstNameInput, form.firstName, 'First name');
      await this.ui.fill(this.lastNameInput, form.lastName, 'Last name');
      await this.ui.fill(this.postalCodeInput, form.postalCode, 'Postal code');
    });
  }

  async continue(): Promise<void> {
    await this.step('Click continue', async () => {
      await this.ui.click(this.continueButton, 'Continue');
    });
  }

  async cancel(): Promise<void> {
    await this.step('Click cancel', async () => {
      await this.ui.click(this.cancelButton, 'Cancel (info)');
    });
  }

  async verifyOnInfo(): Promise<void> {
    await this.verifyOnPage();
  }
}
