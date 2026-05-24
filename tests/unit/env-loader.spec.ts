import { test, expect } from '@playwright/test';
import { ENV, ACTIVE_ENV, loadEnvJson } from '@config/env.config';

test.describe('@unit env loader', () => {
  test('exposes dev defaults when ACTIVE_ENV is dev', () => {
    expect(ACTIVE_ENV).toBe('dev');
    expect(ENV.BASE_URL).toBe('https://www.saucedemo.com');
    expect(ENV.API_BASE_URL).toBe('https://restful-booker.herokuapp.com');
    expect(ENV.DEFAULT_TIMEOUT).toBe(10000);
    expect(ENV.ACTION_TIMEOUT).toBe(8000);
    expect(ENV.NAVIGATION_TIMEOUT).toBe(15000);
  });

  test('loads SauceDemo credentials from secrets template', () => {
    expect(ENV.STANDARD_USER).toBe('standard_user');
    expect(ENV.PASSWORD).toBe('secret_sauce');
  });

  test('loads Restful-Booker credentials from secrets template', () => {
    expect(ENV.RB_USER).toBe('admin');
    expect(ENV.RB_PASSWORD).toBe('password123');
  });

  test('loadEnvJson("ci") deep-merges dev defaults with CI overrides', () => {
    const merged = loadEnvJson('ci');
    expect(merged.baseURL).toBe('https://www.saucedemo.com'); // inherited from dev
    expect(merged.apiBaseURL).toBe('https://restful-booker.herokuapp.com'); // inherited
    expect(merged.timeouts?.default).toBe(10000); // inherited from dev
    expect(merged.timeouts?.action).toBe(15000); // overridden by ci
    expect(merged.timeouts?.navigation).toBe(30000); // overridden by ci
  });

  test('loadEnvJson("dev") returns dev values unchanged', () => {
    const dev = loadEnvJson('dev');
    expect(dev.baseURL).toBe('https://www.saucedemo.com');
    expect(dev.timeouts?.action).toBe(8000);
  });
});
