import { BaseApiService } from './base.api';
import { API_ROUTES } from '@config/api-routes.config';
import type { TypedResponse } from '@/utils/apiClient';

export class HealthService extends BaseApiService {
  async ping(): Promise<TypedResponse<string>> {
    return this.step('ping', async () => this.apiClient.get<string>(API_ROUTES.PING));
  }

  async verifyPingOk(response: TypedResponse<string>): Promise<void> {
    await this.verifyStatus(response, 201);
  }
}
