import type { APIRequestContext, APIResponse } from '@playwright/test';
import { test } from '@playwright/test';
import { ApiError } from './errors';
import { TestLogger } from './logger';

export interface ReqOpts {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
}

export interface TypedResponse<T> {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  body: T;
  raw: APIResponse;
}

function redactBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) return body;
  const SENSITIVE = ['password', 'pwd', 'secret', 'token'];
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body as Record<string, unknown>)) {
    out[k] = SENSITIVE.includes(k.toLowerCase()) ? '***' : v;
  }
  return out;
}

export class ApiClient {
  private readonly logger: TestLogger;

  constructor(
    private readonly request: APIRequestContext,
    private readonly baseURL: string,
    private readonly defaultHeaders: Record<string, string> = {},
  ) {
    this.logger = new TestLogger('ApiClient');
  }

  withToken(token: string): ApiClient {
    return new ApiClient(this.request, this.baseURL, {
      ...this.defaultHeaders,
      Cookie: `token=${token}`,
    });
  }

  async get<T>(pathname: string, opts: ReqOpts = {}): Promise<TypedResponse<T>> {
    return this.send<T>('GET', pathname, undefined, opts);
  }

  async post<T>(pathname: string, body: unknown, opts: ReqOpts = {}): Promise<TypedResponse<T>> {
    return this.send<T>('POST', pathname, body, opts);
  }

  async put<T>(pathname: string, body: unknown, opts: ReqOpts = {}): Promise<TypedResponse<T>> {
    return this.send<T>('PUT', pathname, body, opts);
  }

  async delete(pathname: string, opts: ReqOpts = {}): Promise<TypedResponse<void>> {
    return this.send<void>('DELETE', pathname, undefined, opts);
  }

  private async send<T>(
    method: string,
    pathname: string,
    body: unknown,
    opts: ReqOpts,
  ): Promise<TypedResponse<T>> {
    const url = this.baseURL + pathname;
    return test.step(`${method} ${pathname}`, async () => {
      this.logger.info(
        `${method} ${url}`,
        body !== undefined ? { body: redactBody(body) } : undefined,
      );
      const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...(opts.headers ?? {}),
      };
      const response = await this.request.fetch(url, {
        method,
        headers,
        data: body !== undefined ? JSON.stringify(body) : undefined,
        params: opts.params,
      });
      const status = response.status();
      const ok = status >= 200 && status < 300;
      const responseHeaders = response.headers();
      let parsed: T = undefined as unknown as T;
      const text = await response.text();
      if (text.length > 0) {
        try {
          parsed = JSON.parse(text) as T;
        } catch {
          parsed = text as unknown as T;
        }
      }
      this.logger.info(`← ${status} ${method} ${pathname}`);
      if (status >= 500) {
        throw new ApiError(`${method} ${pathname} returned ${status}`, status, parsed);
      }
      return { status, ok, headers: responseHeaders, body: parsed, raw: response };
    });
  }
}
