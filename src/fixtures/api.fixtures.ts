import { test as base } from '@playwright/test';
import { ApiClient } from '@/utils/apiClient';
import { HealthService, AuthService, BookingsService } from '@/services/api';
import { ENV } from '@config/env.config';
import type { ApiFixtures } from './types';

export const apiTest = base.extend<ApiFixtures>({
  apiClient: async ({ request }, use) => {
    const client = new ApiClient(request, ENV.API_BASE_URL);
    await use(client);
  },
  healthApi: async ({ apiClient }, use) => {
    await use(new HealthService(apiClient));
  },
  authApi: async ({ apiClient }, use) => {
    await use(new AuthService(apiClient));
  },
  bookingsApi: async ({ apiClient }, use) => {
    await use(new BookingsService(apiClient));
  },
});
