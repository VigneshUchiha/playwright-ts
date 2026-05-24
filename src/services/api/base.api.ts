import { test, expect } from '@playwright/test';
import { ApiClient, TypedResponse } from '@/utils/apiClient';
import { TestLogger } from '@/utils/logger';

export abstract class BaseApiService {
  protected readonly logger: TestLogger;

  constructor(protected readonly apiClient: ApiClient) {
    this.logger = new TestLogger(this.constructor.name);
  }

  protected async step<T>(name: string, fn: () => Promise<T>): Promise<T> {
    return test.step(`${this.constructor.name}: ${name}`, fn);
  }

  async verifyStatus<T>(response: TypedResponse<T>, expected: number): Promise<void> {
    await this.step(`verify status ${expected}`, async () => {
      expect(response.status, `Expected ${expected} but got ${response.status}`).toBe(expected);
    });
  }

  async verifyHeader<T>(
    response: TypedResponse<T>,
    name: string,
    expected: string | RegExp,
  ): Promise<void> {
    await this.step(`verify header ${name}`, async () => {
      const actual = response.headers[name.toLowerCase()];
      if (expected instanceof RegExp) {
        expect(actual).toMatch(expected);
      } else {
        expect(actual).toBe(expected);
      }
    });
  }
}
