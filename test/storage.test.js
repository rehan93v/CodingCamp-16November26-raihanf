// Feature: todo-life-dashboard
// Unit tests for the Storage module (task 2.1).
//
// These tests load js/app.js (which attaches the module objects to the global
// window object via an IIFE), then exercise the Storage module's public
// contract against a Local Storage mock so failure modes (quota exceeded,
// disabled storage) can be simulated.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { installStorageMock, uninstallStorageMock } from './storage-mock.js';

// Load the application script once. The IIFE executes as a side effect and
// attaches Storage (and the other module namespaces) to the global window.
await import('../js/app.js');

const Storage = () => window.Storage;

describe('Storage.isAvailable', () => {
  let mock;
  beforeEach(() => { mock = installStorageMock(); });
  afterEach(() => { uninstallStorageMock(); });

  it('returns true when Local Storage can be read and written', () => {
    expect(Storage().isAvailable()).toBe(true);
  });

  it('returns false when storage access throws (disabled)', () => {
    mock.setUnavailable(true);
    expect(Storage().isAvailable()).toBe(false);
  });

  it('leaves no leftover probe key after a successful probe', () => {
    Storage().isAvailable();
    expect(mock.keys()).not.toContain('tld.__probe__');
  });
});

describe('Storage.get', () => {
  let mock;
  beforeEach(() => { mock = installStorageMock(); });
  afterEach(() => { uninstallStorageMock(); });

  it('returns defaultValue when the key is missing', () => {
    expect(Storage().get('tld.tasks', [])).toEqual([]);
  });

  it('returns the parsed value when the key exists', () => {
    mock.setItem('tld.tasks', JSON.stringify([{ id: 'a', text: 'buy milk' }]));
    expect(Storage().get('tld.tasks', [])).toEqual([{ id: 'a', text: 'buy milk' }]);
  });

  it('returns defaultValue when the stored value is JSON null', () => {
    mock.setItem('tld.pomodoroDuration', JSON.stringify(null));
    expect(Storage().get('tld.pomodoroDuration', 25)).toBe(25);
  });

  it('returns defaultValue when parsing fails', () => {
    mock.setItem('tld.tasks', 'not-valid-json{');
    expect(Storage().get('tld.tasks', [])).toEqual([]);
  });

  it('returns defaultValue when storage access throws', () => {
    mock.setUnavailable(true);
    expect(Storage().get('tld.theme', 'light')).toBe('light');
  });

  it('preserves falsy non-null values like 0 and false', () => {
    mock.setItem('tld.pomodoroDuration', JSON.stringify(0));
    expect(Storage().get('tld.pomodoroDuration', 25)).toBe(0);
    mock.setItem('tld.flag', JSON.stringify(false));
    expect(Storage().get('tld.flag', true)).toBe(false);
  });
});

describe('Storage.set', () => {
  let mock;
  beforeEach(() => { mock = installStorageMock(); });
  afterEach(() => { uninstallStorageMock(); });

  it('stringifies and writes the value, returning true', () => {
    expect(Storage().set('tld.tasks', [{ id: '1' }])).toBe(true);
    expect(mock.getItem('tld.tasks')).toBe(JSON.stringify([{ id: '1' }]));
  });

  it('writes numbers and strings correctly', () => {
    expect(Storage().set('tld.pomodoroDuration', 30)).toBe(true);
    expect(JSON.parse(mock.getItem('tld.pomodoroDuration'))).toBe(30);
    expect(Storage().set('tld.theme', 'dark')).toBe(true);
    expect(JSON.parse(mock.getItem('tld.theme'))).toBe('dark');
  });

  it('returns false on QuotaExceededError', () => {
    mock.setQuotaExceeded(true);
    expect(Storage().set('tld.tasks', [])).toBe(false);
  });

  it('returns false when storage access throws', () => {
    mock.setUnavailable(true);
    expect(Storage().set('tld.tasks', [])).toBe(false);
  });

  it('returns false on a one-shot write failure then recovers', () => {
    mock.setFailNext(1);
    expect(Storage().set('tld.tasks', [1])).toBe(false);
    expect(Storage().set('tld.tasks', [2])).toBe(true);
    expect(JSON.parse(mock.getItem('tld.tasks'))).toEqual([2]);
  });
});

describe('Storage.remove', () => {
  let mock;
  beforeEach(() => { mock = installStorageMock(); });
  afterEach(() => { uninstallStorageMock(); });

  it('removes the key and returns true', () => {
    mock.setItem('tld.tasks', '[]');
    expect(Storage().remove('tld.tasks')).toBe(true);
    expect(mock.getItem('tld.tasks')).toBeNull();
  });

  it('returns true when removing a missing key', () => {
    expect(Storage().remove('tld.tasks')).toBe(true);
  });

  it('returns false when storage access throws', () => {
    mock.setItem('tld.tasks', '[]');
    mock.setUnavailable(true);
    expect(Storage().remove('tld.tasks')).toBe(false);
  });
});

describe('Storage round trip', () => {
  let mock;
  beforeEach(() => { mock = installStorageMock(); });
  afterEach(() => { uninstallStorageMock(); });

  it('preserves an object through set then get', () => {
    const tasks = [
      { id: 'x1', text: 'one', completed: false, createdAt: 1 },
      { id: 'x2', text: 'two', completed: true, createdAt: 2 },
    ];
    expect(Storage().set('tld.tasks', tasks)).toBe(true);
    expect(Storage().get('tld.tasks', [])).toEqual(tasks);
  });

  it('preserves a number through set then get', () => {
    expect(Storage().set('tld.pomodoroDuration', 45)).toBe(true);
    expect(Storage().get('tld.pomodoroDuration', 25)).toBe(45);
  });

  it('preserves a string through set then get', () => {
    expect(Storage().set('tld.theme', 'dark')).toBe(true);
    expect(Storage().get('tld.theme', 'light')).toBe('dark');
  });
});
