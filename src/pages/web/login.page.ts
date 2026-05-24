import type { Locator } from '@playwright/test';
import { BasePage } from './base.page';
import { ROUTES } from '@config/routes.config';

export class LoginPage extends BasePage {
  private get usernameInput(): Locator {
    return this.page.locator('[data-test="username"]');
  }

  private get passwordInput(): Locator {
    return this.page.locator('[data-test="password"]');
  }

  private get loginButton(): Locator {
    return this.page.locator('[data-test="login-button"]');
  }

  private get errorMessage(): Locator {
    return this.page.locator('[data-test="error"]');
  }

  get pageIdentifier(): Locator {
    // Scope the Swag Labs logo to the login page container so it doesn't match the inventory header logo.
    return this.page.locator('.login_logo');
  }

  async open(): Promise<void> {
    await this.navigate(ROUTES.LOGIN);
    await this.verifyOnPage();
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.step('Sign in', async () => {
      await this.ui.fill(this.usernameInput, username, 'Username');
      await this.ui.fill(this.passwordInput, password, 'Password');
      await this.ui.click(this.loginButton, 'Login button');
    });
  }

  async verifyOnLogin(): Promise<void> {
    await this.verifyOnPage();
  }

  async verifyLoginError(expected: string): Promise<void> {
    await this.step('Verify login error', async () => {
      await this.ui.expectVisible(this.errorMessage, 'Login error banner');
      await this.ui.expectContainsText(this.errorMessage, expected, 'Login error text');
    });
  }
}
