import * as fs from 'fs';
import * as path from 'path';
import { ACTIVE_ENV, ENV } from '@config/env.config';

function sanitizeValue(value: string): string {
  return value.replace(/[\r\n]/g, '');
}

async function globalSetup(): Promise<void> {
  const resultsDir = path.resolve(process.cwd(), 'allure-results');
  fs.mkdirSync(resultsDir, { recursive: true });

  const props = [
    `Environment=${sanitizeValue(ACTIVE_ENV)}`,
    `BaseURL=${sanitizeValue(ENV.BASE_URL)}`,
    `ApiBaseURL=${sanitizeValue(ENV.API_BASE_URL)}`,
    `Node=${sanitizeValue(process.version)}`,
  ].join('\n');
  fs.writeFileSync(path.join(resultsDir, 'environment.properties'), props, 'utf8');

  fs.writeFileSync(
    path.join(resultsDir, 'executor.json'),
    JSON.stringify(
      {
        name: ENV.CI ? 'GitHub Actions' : 'Local',
        type: ENV.CI ? 'github' : 'local',
        reportName: 'Playwright TS — SauceDemo + Restful-Booker',
      },
      null,
      2,
    ),
    'utf8',
  );

  fs.writeFileSync(
    path.join(resultsDir, 'categories.json'),
    JSON.stringify(
      [
        {
          name: 'Validation errors',
          matchedStatuses: ['failed'],
          messageRegex: '.*ValidationError.*',
        },
        { name: 'API errors', matchedStatuses: ['failed'], messageRegex: '.*ApiError.*' },
        { name: 'Timeouts', matchedStatuses: ['failed'], messageRegex: '.*Timeout.*' },
      ],
      null,
      2,
    ),
    'utf8',
  );
}

export default globalSetup;
