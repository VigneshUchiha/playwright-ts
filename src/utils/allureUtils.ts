import { allure } from 'allure-playwright';

export enum Severity {
  BLOCKER = 'blocker',
  CRITICAL = 'critical',
  NORMAL = 'normal',
  MINOR = 'minor',
  TRIVIAL = 'trivial',
}

export interface TestMetadata {
  feature?: string;
  story?: string;
  severity?: Severity;
  testId?: string;
  tags?: string[];
}

export async function setTestMetadata(meta: TestMetadata): Promise<void> {
  if (meta.feature) await allure.feature(meta.feature);
  if (meta.story) await allure.story(meta.story);
  if (meta.severity) await allure.severity(meta.severity);
  if (meta.testId) await allure.tms(meta.testId, meta.testId);
  if (meta.tags) {
    for (const tag of meta.tags) {
      await allure.tag(tag);
    }
  }
}
