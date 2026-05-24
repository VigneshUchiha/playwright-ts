import { expect, test, type Locator, type Page } from '@playwright/test';
import { TestLogger } from './logger';

export class UIActions {
  private readonly logger: TestLogger;

  constructor(private readonly page: Page) {
    this.logger = new TestLogger('UIActions');
  }

  // === Interactions ===

  async click(locator: Locator, label?: string): Promise<void> {
    await test.step(label ? `Click ${label}` : 'Click element', async () => {
      this.logger.info(`Click ${label ?? '<locator>'}`);
      await locator.click();
    });
  }

  async fill(locator: Locator, value: string, label?: string): Promise<void> {
    await test.step(label ? `Fill ${label}` : 'Fill input', async () => {
      this.logger.info(`Fill ${label ?? '<input>'} with "${value}"`);
      await locator.fill(value);
    });
  }

  async selectOption(locator: Locator, value: string, label?: string): Promise<void> {
    await test.step(label ? `Select ${label} = "${value}"` : 'Select option', async () => {
      this.logger.info(`Select ${label ?? '<select>'} = ${value}`);
      await locator.selectOption(value);
    });
  }

  // === Assertions ===

  async expectVisible(locator: Locator, label?: string): Promise<void> {
    await test.step(label ? `Expect ${label} visible` : 'Expect visible', async () => {
      await expect(locator).toBeVisible();
    });
  }

  async expectHidden(locator: Locator, label?: string): Promise<void> {
    await test.step(label ? `Expect ${label} hidden` : 'Expect hidden', async () => {
      await expect(locator).toBeHidden();
    });
  }

  async expectText(locator: Locator, expected: string | RegExp, label?: string): Promise<void> {
    await test.step(label ? `Expect ${label} text` : 'Expect text', async () => {
      await expect(locator).toHaveText(expected);
    });
  }

  async expectContainsText(locator: Locator, expected: string, label?: string): Promise<void> {
    await test.step(label ? `Expect ${label} contains text` : 'Expect contains text', async () => {
      await expect(locator).toContainText(expected);
    });
  }
}
