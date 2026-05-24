import * as fs from 'fs';
import * as path from 'path';

type EnvName = 'dev' | 'ci';

export interface EnvJson {
  baseURL?: string;
  apiBaseURL?: string;
  timeouts?: { default?: number; action?: number; navigation?: number };
}

interface Secrets {
  saucedemo?: { standardUser?: string; password?: string };
  restfulBooker?: { username?: string; password?: string };
}

const ROOT = path.resolve(__dirname, '..');

function readJson<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function parseEnvArg(): EnvName {
  // Support both `--env=value` and `--env value`
  let value: string | undefined;
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg.startsWith('--env=')) {
      value = arg.slice('--env='.length);
      break;
    }
    if (arg === '--env' && i + 1 < process.argv.length) {
      value = process.argv[i + 1];
      break;
    }
  }
  const resolved = value ?? process.env.ACTIVE_ENV ?? 'dev';
  return resolved === 'ci' ? 'ci' : 'dev';
}

export function loadEnvJson(env: EnvName): EnvJson {
  const dev = readJson<EnvJson>(path.join(ROOT, 'config/environments/dev.json')) ?? {};
  if (env === 'dev') return dev;
  const overlay = readJson<EnvJson>(path.join(ROOT, `config/environments/${env}.json`)) ?? {};
  return {
    ...dev,
    ...overlay,
    timeouts: { ...(dev.timeouts ?? {}), ...(overlay.timeouts ?? {}) },
  };
}

function loadSecrets(): Secrets {
  const real = readJson<Secrets>(path.join(ROOT, 'config/secrets/secrets.json'));
  if (real) return real;
  return readJson<Secrets>(path.join(ROOT, 'config/secrets/secrets.template.json')) ?? {};
}

export const ACTIVE_ENV: EnvName = parseEnvArg();
const json = loadEnvJson(ACTIVE_ENV);
const secrets = loadSecrets();

export const ENV = {
  BASE_URL: process.env.BASE_URL ?? json.baseURL ?? 'https://www.saucedemo.com',
  API_BASE_URL:
    process.env.API_BASE_URL ?? json.apiBaseURL ?? 'https://restful-booker.herokuapp.com',
  DEFAULT_TIMEOUT:
    process.env.DEFAULT_TIMEOUT !== undefined
      ? Number(process.env.DEFAULT_TIMEOUT)
      : (json.timeouts?.default ?? 10000),
  ACTION_TIMEOUT:
    process.env.ACTION_TIMEOUT !== undefined
      ? Number(process.env.ACTION_TIMEOUT)
      : (json.timeouts?.action ?? 8000),
  NAVIGATION_TIMEOUT:
    process.env.NAVIGATION_TIMEOUT !== undefined
      ? Number(process.env.NAVIGATION_TIMEOUT)
      : (json.timeouts?.navigation ?? 15000),
  STANDARD_USER: process.env.STANDARD_USER ?? secrets.saucedemo?.standardUser ?? 'standard_user',
  PASSWORD: process.env.PASSWORD ?? secrets.saucedemo?.password ?? 'secret_sauce',
  RB_USER: process.env.RB_USER ?? secrets.restfulBooker?.username ?? 'admin',
  RB_PASSWORD: process.env.RB_PASSWORD ?? secrets.restfulBooker?.password ?? 'password123',
  CI: !!process.env.CI,
} as const;
