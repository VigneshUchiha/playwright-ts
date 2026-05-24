import { test, expect } from '@playwright/test';
import { SchemaValidator } from '@/utils/schemaValidator';
import { ValidationError } from '@/utils/errors';

const userSchema = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'number' },
    name: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
};

test.describe('@unit SchemaValidator', () => {
  test('accepts a valid payload', () => {
    const v = new SchemaValidator();
    v.register('user', userSchema);
    expect(() => v.validate('user', { id: 1, name: 'Alice' })).not.toThrow();
  });

  test('throws ValidationError for missing required field', () => {
    const v = new SchemaValidator();
    v.register('user', userSchema);
    expect(() => v.validate('user', { id: 1 })).toThrow(ValidationError);
  });

  test('throws ValidationError for wrong type', () => {
    const v = new SchemaValidator();
    v.register('user', userSchema);
    expect(() => v.validate('user', { id: 'one', name: 'Alice' })).toThrow(ValidationError);
  });

  test('throws when validating against unknown schema', () => {
    const v = new SchemaValidator();
    expect(() => v.validate('unknown', {})).toThrow(/unknown/i);
  });
});
