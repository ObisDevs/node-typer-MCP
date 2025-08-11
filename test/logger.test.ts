import { describe, it, expect, vi } from 'vitest';
import { createLogger } from '../src/logger/index';

describe('Logger functionality', () => {
  it('should create logger with all methods', () => {
    const logger = createLogger();
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  it('should respect log levels', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger({ level: 'warn' });
    logger.debug('debug');
    logger.info('info');
    logger.warn('warn');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});