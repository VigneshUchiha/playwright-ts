import * as fs from 'fs';
import * as path from 'path';
import { expect } from '@playwright/test';
import { BaseApiService } from './base.api';
import { ApiClient, TypedResponse } from '@/utils/apiClient';
import { SchemaValidator } from '@/utils/schemaValidator';
import { API_ROUTES } from '@config/api-routes.config';

interface AuthRequest {
  username: string;
  password: string;
}

interface AuthOkResponse {
  token: string;
}

interface AuthErrorResponse {
  reason: string;
}

const SCHEMAS_DIR = path.resolve(__dirname, '../../../test-data/schemas');

function loadSchema(name: string): object {
  return JSON.parse(fs.readFileSync(path.join(SCHEMAS_DIR, `${name}.schema.json`), 'utf8'));
}

export class AuthService extends BaseApiService {
  private readonly validator: SchemaValidator;

  constructor(apiClient: ApiClient) {
    super(apiClient);
    this.validator = new SchemaValidator();
    this.validator.register('token', loadSchema('token'));
  }

  async createToken(creds: AuthRequest): Promise<TypedResponse<AuthOkResponse | AuthErrorResponse>> {
    return this.step('createToken', async () =>
      this.apiClient.post<AuthOkResponse | AuthErrorResponse>(API_ROUTES.AUTH, creds),
    );
  }

  async verifyTokenIssued(
    response: TypedResponse<AuthOkResponse | AuthErrorResponse>,
  ): Promise<void> {
    await this.step('verify token issued', async () => {
      await this.verifyStatus(response, 200);
      this.validator.validate('token', response.body);
    });
  }

  async verifyBadCredentials(
    response: TypedResponse<AuthOkResponse | AuthErrorResponse>,
  ): Promise<void> {
    await this.step('verify Bad credentials reason', async () => {
      await this.verifyStatus(response, 200);
      expect(response.body, 'response should expose a "reason" field').toHaveProperty('reason');
      expect((response.body as AuthErrorResponse).reason).toBe('Bad credentials');
    });
  }
}
