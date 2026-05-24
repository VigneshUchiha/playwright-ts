import { test, type Locator, type Page } from '@playwright/test';
import { UIActions } from '@/utils/uiActions';
import { TestLogger } from '@/utils/logger';
import { ENV } from '@config/env.config';

export abstract class BasePage {
  protected readonly ui: UIActions;
  protected readonly logger: TestLogger;

  constructor(protected readonly page: Page) {
    this.ui = new UIActions(page);
    this.logger = new TestLogger(this.constructor.name);
  }

  abstract get pageIdentifier(): Locator;

  async navigate(path: string = '/'): Promise<void> {
    await this.step(`Navigate to ${path}`, async () => {
      await this.page.goto(ENV.BASE_URL + path);
    });
  }

  async verifyOnPage(): Promise<void> {
    await this.step(`Verify ${this.constructor.name} is loaded`, async () => {
      await this.ui.expectVisible(this.pageIdentifier, this.constructor.name);
    });
  }

  protected async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return test.step(`${this.constructor.name}: ${name}`, fn);
  }
}
