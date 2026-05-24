import type { ApiClient } from '@/utils/apiClient';
import type { HealthService, AuthService, BookingsService } from '@/services/api';

export interface ApiFixtures {
  apiClient: ApiClient;
  healthApi: HealthService;
  authApi: AuthService;
  bookingsApi: BookingsService;
}

export interface PageFixtures {
  // populated in Slice 4 (web layer)
  __reserved?: never;
}
