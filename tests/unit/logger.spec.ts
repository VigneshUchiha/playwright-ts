import { test, expect } from '@playwright/test';
import { TestLogger, LogLevel } from '@/utils/logger';

test.describe('@unit TestLogger', () => {
  test('emits messages at and above the configured level', () => {
    const captured: string[] = [];
    const log = new TestLogger('TEST', LogLevel.INFO, (line) => captured.push(line));

    log.debug('hidden');
    log.info('shown-info');
    log.warn('shown-warn');
    log.error('shown-error');

    expect(captured.length).toBe(3);
    expect(captured[0]).toContain('shown-info');
    expect(captured[1]).toContain('shown-warn');
    expect(captured[2]).toContain('shown-error');
  });

  test('embeds tag and level in output', () => {
    const captured: string[] = [];
    const log = new TestLogger('LoginPage', LogLevel.DEBUG, (line) => captured.push(line));

    log.info('clicked button');

    expect(captured[0]).toContain('[INFO]');
    expect(captured[0]).toContain('[LoginPage]');
    expect(captured[0]).toContain('clicked button');
  });

  test('child loggers inherit level and sink and compose the tag', () => {
    const captured: string[] = [];
    const parent = new TestLogger('Parent', LogLevel.WARN, (line) => captured.push(line));
    const child = parent.child('Sub');

    child.debug('hidden-debug');
    child.info('hidden-info');
    child.warn('shown-warn');

    expect(captured.length).toBe(1);
    expect(captured[0]).toContain('shown-warn');
    expect(captured[0]).toContain('[Parent/Sub]');
  });
});
