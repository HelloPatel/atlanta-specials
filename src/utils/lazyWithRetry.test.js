import { describe, it, expect, vi } from 'vitest';
import { isChunkLoadError, resolveChunkFailureAction, retryImport } from './lazyWithRetry';

describe('isChunkLoadError', () => {
  it('returns false for nullish input', () => {
    expect(isChunkLoadError(null)).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });

  it('detects ChunkLoadError by name', () => {
    const err = new Error('boom');
    err.name = 'ChunkLoadError';
    expect(isChunkLoadError(err)).toBe(true);
  });

  it('detects "Loading chunk failed" messages', () => {
    expect(isChunkLoadError(new Error('Loading chunk 42 failed'))).toBe(true);
  });

  it('detects failed dynamic import messages', () => {
    expect(
      isChunkLoadError(new Error('Failed to fetch dynamically imported module: /assets/x.js'))
    ).toBe(true);
    expect(
      isChunkLoadError(new Error('error loading dynamically imported module'))
    ).toBe(true);
  });

  it('detects CSS chunk and MIME-type-html failures', () => {
    expect(isChunkLoadError(new Error('Loading CSS chunk 3 failed'))).toBe(true);
    expect(
      isChunkLoadError(new Error("Expected a JavaScript module but 'text/html' is not a valid JavaScript MIME type"))
    ).toBe(true);
  });

  it('accepts a raw string message', () => {
    expect(isChunkLoadError('Importing a module script failed')).toBe(true);
  });

  it('returns false for unrelated errors', () => {
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError(new TypeError('x is not a function'))).toBe(false);
  });
});

describe('resolveChunkFailureAction', () => {
  it('reloads on a chunk error not yet reloaded', () => {
    const err = new Error('Loading chunk 1 failed');
    expect(resolveChunkFailureAction(err, false)).toBe('reload');
  });

  it('throws on a chunk error that already triggered a reload (loop guard)', () => {
    const err = new Error('Loading chunk 1 failed');
    expect(resolveChunkFailureAction(err, true)).toBe('throw');
  });

  it('throws on a non-chunk error regardless of reload state', () => {
    const err = new Error('some runtime bug');
    expect(resolveChunkFailureAction(err, false)).toBe('throw');
    expect(resolveChunkFailureAction(err, true)).toBe('throw');
  });
});

describe('retryImport', () => {
  it('returns the module on first success without retrying', async () => {
    const factory = vi.fn().mockResolvedValue({ default: 'ok' });
    const result = await retryImport(factory);
    expect(result).toEqual({ default: 'ok' });
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('retries once after a transient failure then succeeds', async () => {
    const factory = vi
      .fn()
      .mockRejectedValueOnce(new Error('network blip'))
      .mockResolvedValue({ default: 'ok' });
    const result = await retryImport(factory, 1, 0);
    expect(result).toEqual({ default: 'ok' });
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('rethrows after exhausting retries', async () => {
    const factory = vi.fn().mockRejectedValue(new Error('persistent failure'));
    await expect(retryImport(factory, 1, 0)).rejects.toThrow('persistent failure');
    expect(factory).toHaveBeenCalledTimes(2);
  });
});
