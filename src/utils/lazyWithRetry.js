import { lazy } from 'react';

// One-shot guard so a stale-chunk hard reload can never loop forever.
const RELOAD_FLAG = 'phera:chunk-reloaded';

/**
 * Detect a failed dynamic-import / code-split chunk load. These happen most
 * often when a new version is deployed while a user has the old index.html open:
 * the hashed chunk URLs it references no longer exist (404), so `import()`
 * rejects and the page appears to "fail to load".
 */
export function isChunkLoadError(error) {
  if (!error) return false;
  const message = String(error.message || error);
  const name = error.name || '';
  return (
    name === 'ChunkLoadError' ||
    /Loading chunk\s+[\w-]+\s+failed/i.test(message) ||
    /Loading CSS chunk/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /'text\/html' is not a valid JavaScript MIME type/i.test(message)
  );
}

/**
 * Await a dynamic-import factory, retrying a small number of times with
 * exponential backoff. A transient network blip is a common cause of a single
 * failed chunk fetch, so one quiet retry recovers most cases without a reload.
 */
export async function retryImport(factory, retries = 1, delay = 300) {
  try {
    return await factory();
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryImport(factory, retries - 1, delay * 2);
  }
}

/**
 * Decide how to handle a dynamic-import failure. Pure so it can be unit tested.
 * Returns:
 *   'reload' — stale chunk, no reload attempted yet → do a one-time hard reload
 *   'throw'  — either not a chunk error, or we already reloaded once → surface
 *              the error to the nearest ErrorBoundary instead of looping.
 */
export function resolveChunkFailureAction(error, alreadyReloaded) {
  if (isChunkLoadError(error) && !alreadyReloaded) return 'reload';
  return 'throw';
}

function readReloadFlag() {
  try {
    return window.sessionStorage?.getItem(RELOAD_FLAG) === '1';
  } catch {
    return false;
  }
}

function writeReloadFlag(value) {
  try {
    if (value) window.sessionStorage?.setItem(RELOAD_FLAG, '1');
    else window.sessionStorage?.removeItem(RELOAD_FLAG);
  } catch {
    /* sessionStorage may be unavailable (private mode / SSR) — ignore */
  }
}

/**
 * Drop-in replacement for React.lazy that is resilient to code-split chunk
 * failures. Retries a transient failure, and on a genuine stale-chunk failure
 * (typically after a deploy) performs a single hard reload to fetch the fresh
 * asset manifest. Guards against reload loops, and clears the guard after any
 * successful load so a later deploy can recover too.
 */
export function lazyWithRetry(factory) {
  return lazy(async () => {
    try {
      const module = await retryImport(factory);
      // Successful load — reset the one-shot guard so a future stale chunk can
      // trigger its own reload.
      writeReloadFlag(false);
      return module;
    } catch (error) {
      const action = resolveChunkFailureAction(error, readReloadFlag());
      if (action === 'reload' && typeof window !== 'undefined') {
        writeReloadFlag(true);
        window.location.reload();
        // Render nothing while the browser navigates away for the reload.
        return { default: () => null };
      }
      throw error;
    }
  });
}
