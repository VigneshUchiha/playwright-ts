import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';
import { ValidationError, FrameworkError } from './errors';

export class SchemaValidator {
  private readonly ajv: Ajv;
  private readonly compiled: Map<string, ValidateFunction> = new Map();

  constructor() {
    this.ajv = new Ajv({ allErrors: true, strict: false });
    addFormats(this.ajv);
  }

  register(name: string, schema: object): void {
    this.compiled.set(name, this.ajv.compile(schema));
  }

  validate(name: string, data: unknown): void {
    const validator = this.compiled.get(name);
    if (!validator) {
      throw new FrameworkError(`Schema "${name}" not registered`);
    }
    const ok = validator(data);
    if (!ok) {
      throw new ValidationError(`Schema "${name}" validation failed`, validator.errors ?? []);
    }
  }
}
