// Feature: todo-life-dashboard
// Local Storage mock for property-based and example-based tests.
//
// Implements the localStorage Web Storage interface (getItem / setItem /
// removeItem / clear) backed by an in-memory Map so tests can exercise the
// Storage module's persistence and failure-handling paths without a real
// browser storage. The mock supports configurable failure modes that let tests
// simulate QuotaExceededError (write quota exceeded) and SecurityError
// (storage disabled, e.g. private browsing) per the design's Error Handling
// section.
//
// These helpers are dev/test-only; the deployed dashboard remains framework-free
// (Requirement 15.1).

/**
 * Create a fresh Local Storage mock instance.
 *
 * The returned object implements the Web Storage interface:
 *   - getItem(key)        -> string | null
 *   - setItem(key, value) -> void (throws on configured failure)
 *   - removeItem(key)     -> void
 *   - clear()             -> void
 *
 * Plus control methods for tests:
 *   - setQuotaExceeded(true|false)  make every setItem throw QuotaExceededError
 *   - setUnavailable(true|false)    make every access throw SecurityError
 *                                    (simulates disabled storage)
 *   - setFailNext(n)                 make the next n setItem calls throw
 *                                    QuotaExceededError, then auto-clear
 *   - reset()                        restore default behaviour and clear data
 *
 * @returns {StorageMock}
 */
export function createStorageMock() {
  const store = new Map();
  let quotaExceeded = false;
  let unavailable = false;
  let failNext = 0;

  function guardAccess() {
    if (unavailable) {
      const err = new DOMException('Access to localStorage is denied', 'SecurityError');
      throw err;
    }
  }

  return {
    get length() {
      guardAccess();
      return store.size;
    },

    key(index) {
      guardAccess();
      const keys = [...store.keys()];
      return index >= 0 && index < keys.length ? keys[index] : null;
    },

    getItem(key) {
      guardAccess();
      return store.has(key) ? store.get(key) : null;
    },

    setItem(key, value) {
      guardAccess();
      if (quotaExceeded || failNext > 0) {
        if (failNext > 0) failNext -= 1;
        throw new DOMException(
          'The quota has been exceeded',
          'QuotaExceededError',
        );
      }
      // Mirror the Web Storage API: coerce values to strings.
      store.set(String(key), String(value));
    },

    removeItem(key) {
      guardAccess();
      store.delete(String(key));
    },

    clear() {
      guardAccess();
      store.clear();
    },

    // --- test control surface ---

    /** When true, every setItem call throws QuotaExceededError. */
    setQuotaExceeded(value) {
      quotaExceeded = Boolean(value);
    },

    /** When true, every access (get/set/remove) throws SecurityError. */
    setUnavailable(value) {
      unavailable = Boolean(value);
    },

    /** Make the next `count` setItem calls throw QuotaExceededError, then stop. */
    setFailNext(count = 1) {
      failNext = Math.max(0, Math.floor(count));
    },

    /** Restore default behaviour (no failures) and clear stored data. */
    reset() {
      quotaExceeded = false;
      unavailable = false;
      failNext = 0;
      store.clear();
    },

    /** Read-only snapshot of the stored keys (handy for assertions). */
    keys() {
      return [...store.keys()];
    },
  };
}

/**
 * Install a storage mock as the active localStorage on the global object.
 *
 * @param {StorageMock} [mock] mock to install; a fresh one is created if omitted
 * @param {object} [target] object to attach to; defaults to globalThis
 * @returns {StorageMock} the installed mock
 */
export function installStorageMock(mock, target = globalThis) {
  const instance = mock || createStorageMock();
  target.localStorage = instance;
  return instance;
}

/**
 * Remove the installed storage mock from the global object.
 *
 * @param {object} [target] object to detach from; defaults to globalThis
 */
export function uninstallStorageMock(target = globalThis) {
  delete target.localStorage;
}
