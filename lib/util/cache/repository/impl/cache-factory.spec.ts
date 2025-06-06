import { vi } from 'vitest';
import { logger } from '../../../../logger';
import { CacheFactory } from './cache-factory';

describe('util/cache/repository/impl/cache-factory', () => {
  let originalWarn: typeof logger.warn;
  let warnSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalWarn = logger.warn;
    warnSpy = vi.fn();
    logger.warn = warnSpy;
  });

  afterEach(() => {
    logger.warn = originalWarn;
  });

  it('should redact credentials in cacheType when logging unsupported type', () => {
    const cacheType = 'unsupported://ACCESS_KEY:SECRET_KEY@bucket-name';
    CacheFactory.get('repo', 'fingerprint', cacheType);
    expect(warnSpy).toHaveBeenCalledWith(
      { cacheType: 'unsupported://**redacted**@bucket-name' },
      expect.stringContaining('Repository cache type not supported'),
    );
  });

  it('should not log for supported types', () => {
    CacheFactory.get('repo', 'fingerprint', 'local');
    CacheFactory.get('repo', 'fingerprint', 's3://bucket-name');
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
