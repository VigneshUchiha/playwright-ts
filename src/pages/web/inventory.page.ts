import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';

export class InventoryPage extends BasePage {
  private get container(): Locator {
    // Use data-test to avoid strict-mode ambiguity: SauceDemo renders two
    // nested divs both carrying id="inventory_container".
    return this.page.locator('[data-test="inventory-container"]');
  }

  private get appLogo(): Locator {
    // Scoped to the inventory header so it doesn't collide with login_logo
    return this.page.locator('.app_logo');
  }

  private get hamburgerButton(): Locator {
    return this.page.getByRole('button', { name: 'Open Menu' });
  }

  private get cartLink(): Locator {
    return this.page.locator('[data-test="shopping-cart-link"]');
  }

  private get cartBadge(): Locator {
    return this.page.locator('.shopping_cart_badge');
  }

  private get sortDropdown(): Locator {
    return this.page.locator('[data-test="product-sort-container"]');
  }

  private get logoutLink(): Locator {
    return this.page.locator('[data-test="logout-sidebar-link"]');
  }

  /**
   * Converts a product display name into the data-test slug SauceDemo uses
   * (e.g. "Sauce Labs Backpack" → "sauce-labs-backpack").
   * Whitespace is the only character transformed; SauceDemo preserves dots,
   * parens, and other punctuation in their attribute (e.g. "Test.allTheThings()
   * T-Shirt (Red)" → "test.allthethings()-t-shirt-(red)"). If a product is
   * added with characters that don't survive this naive slugging, the locator
   * will silently match zero elements — verify with the live locator JSON.
   */
  private addToCartByName(name: string): Locator {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return this.page.locator(`[data-test="add-to-cart-${slug}"]`);
  }

  private removeByName(name: string): Locator {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    return this.page.locator(`[data-test="remove-${slug}"]`);
  }

  get pageIdentifier(): Locator {
    return this.container;
  }

  async addToCart(productName: string): Promise<void> {
    await this.step(`Add "${productName}" to cart`, async () => {
      await this.ui.click(this.addToCartByName(productName), `Add ${productName}`);
    });
  }

  async removeFromCart(productName: string): Promise<void> {
    await this.step(`Remove "${productName}" from cart`, async () => {
      await this.ui.click(this.removeByName(productName), `Remove ${productName}`);
    });
  }

  async openCart(): Promise<void> {
    await this.step('Open cart', async () => {
      await this.ui.click(this.cartLink, 'Cart icon');
    });
  }

  async sortBy(value: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await this.step(`Sort by ${value}`, async () => {
      await this.ui.selectOption(this.sortDropdown, value, 'Sort');
    });
  }

  async openMenu(): Promise<void> {
    await this.step('Open menu', async () => {
      await this.ui.click(this.hamburgerButton, 'Hamburger menu');
    });
  }

  async logout(): Promise<void> {
    await this.step('Logout', async () => {
      await this.openMenu();
      await this.ui.click(this.logoutLink, 'Logout');
    });
  }

  async verifyOnInventory(): Promise<void> {
    await this.verifyOnPage();
    await this.ui.expectVisible(this.appLogo, 'App header logo');
  }

  async verifyCartBadge(expected: number): Promise<void> {
    await this.step(`Verify cart badge = ${expected}`, async () => {
      if (expected === 0) {
        await this.ui.expectHidden(this.cartBadge, 'Cart badge');
        return;
      }
      await this.ui.expectText(this.cartBadge, String(expected), 'Cart badge');
    });
  }
}
