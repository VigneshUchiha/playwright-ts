import type { ErrorObject } from 'ajv';

export class FrameworkError extends Error {
  constructor(
    message: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'FrameworkError';
  }
}

export class ValidationError extends FrameworkError {
  constructor(
    message: string,
    public readonly errors: ErrorObject[],
  ) {
    super(message, { errors });
    this.name = 'ValidationError';
  }
}

export class ApiError extends FrameworkError {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message, { status, body });
    this.name = 'ApiError';
  }
}
