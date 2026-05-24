import * as fs from 'fs';
import * as path from 'path';
import { FrameworkError } from './errors';

interface TestDataFile {
  [entityKey: string]: Array<{ TC_ID: string; [k: string]: unknown }>;
}

const ROOT = path.resolve(__dirname, '../..');
const DATA_PATH = path.join(ROOT, 'test-data/testdata.json');

let cached: TestDataFile | null = null;

function load(): TestDataFile {
  if (cached) return cached;
  if (!fs.existsSync(DATA_PATH)) {
    throw new FrameworkError(`test-data/testdata.json not found at ${DATA_PATH}`);
  }
  cached = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) as TestDataFile;
  return cached;
}

export const testDataManager = {
  getByTcId<T extends { TC_ID: string }>(entity: string, tcId: string): T {
    const data = load();
    const collection = data[entity];
    if (!collection) {
      throw new FrameworkError(
        `Unknown test-data entity "${entity}". Available: ${Object.keys(data).join(', ') || '(none)'}`,
      );
    }
    const found = collection.find((row) => row.TC_ID === tcId);
    if (!found) {
      throw new FrameworkError(`No test data found for ${entity}/${tcId}`);
    }
    return found as T;
  },
  all<T extends { TC_ID: string }>(entity: string): T[] {
    const data = load();
    const collection = data[entity];
    if (!collection) {
      throw new FrameworkError(
        `Unknown test-data entity "${entity}". Available: ${Object.keys(data).join(', ') || '(none)'}`,
      );
    }
    return collection as T[];
  },
};
