// Feature: todo-life-dashboard
// Unit tests for the Core pure functions (task 2.2).
//
// These tests load js/app.js (which attaches the module namespaces to the
// global window via an IIFE) and exercise the Core module's pure helpers:
// time/date formatting, greeting selection, countdown math, validators, and
// the sort comparator. Edge cases covered: midnight/noon formatting, greeting
// boundaries, sort stability, non-mutation, and URL scheme rejection
// (javascript:/data:/ftp).

import { describe, it, expect } from 'vitest';

// Load the application script once. The IIFE executes as a side effect and
// attaches Core (and the other module namespaces) to the global window.
await import('../js/app.js');

const Core = () => window.Core;

describe('Core.formatTime', () => {
  function at(h, m, s) {
    return new Date(2025, 0, 1, h, m, s);
  }

  it('renders midnight as 12:00:00 AM', () => {
    expect(Core().formatTime(at(0, 0, 0))).toBe('12:00:00 AM');
  });

  it('renders noon as 12:00:00 PM', () => {
    expect(Core().formatTime(at(12, 0, 0))).toBe('12:00:00 PM');
  });

  it('renders a single-digit hour zero-padded to two digits', () => {
    expect(Core().formatTime(at(1, 5, 9))).toBe('01:05:09 AM');
  });

  it('renders 11:59:59 PM for the last second of the day', () => {
    expect(Core().formatTime(at(23, 59, 59))).toBe('11:59:59 PM');
  });

  it('zero-pads minutes and seconds', () => {
    expect(Core().formatTime(at(9, 5, 3))).toBe('09:05:03 AM');
  });

  it('uses PM for hours 12–23 and AM for hours 0–11', () => {
    expect(Core().formatTime(at(13, 0, 0))).toBe('01:00:00 PM');
    expect(Core().formatTime(at(0, 30, 30))).toBe('12:30:30 AM');
  });

  it('always produces an AM or PM indicator for every hour', () => {
    for (let h = 0; h < 24; h++) {
      const out = Core().formatTime(at(h, 0, 0));
      expect(out.endsWith(' AM') || out.endsWith(' PM')).toBe(true);
    }
  });

  it('keeps the hour in the 1–12 range', () => {
    for (let h = 0; h < 24; h++) {
      const out = Core().formatTime(at(h, 0, 0));
      const hour = parseInt(out.slice(0, 2), 10);
      expect(hour).toBeGreaterThanOrEqual(1);
      expect(hour).toBeLessThanOrEqual(12);
    }
  });
});

describe('Core.formatDate', () => {
  it('formats a known date as "Weekday, Month Day, Year"', () => {
    // January 15, 2025 is a Wednesday.
    expect(Core().formatDate(new Date(2025, 0, 15))).toBe(
      'Wednesday, January 15, 2025'
    );
  });

  it('formats a leap day', () => {
    // February 29, 2024 is a Thursday.
    expect(Core().formatDate(new Date(2024, 1, 29))).toBe(
      'Thursday, February 29, 2024'
    );
  });

  it('contains the full weekday, month, day number, and four-digit year', () => {
    // June 7, 2025 is a Saturday.
    const d = new Date(2025, 5, 7);
    const out = Core().formatDate(d);
    expect(out).toContain('Saturday');
    expect(out).toContain('June');
    expect(out).toContain('7');
    expect(out).toContain('2025');
  });

  it('renders the year with at least four digits', () => {
    expect(Core().formatDate(new Date(2025, 0, 1))).toMatch(/, 2025$/);
  });
});

describe('Core.getGreeting', () => {
  it('returns "Good night" for hours 0–4', () => {
    expect(Core().getGreeting(0)).toBe('Good night');
    expect(Core().getGreeting(4)).toBe('Good night');
  });

  it('returns "Good morning" for hours 5–11', () => {
    expect(Core().getGreeting(5)).toBe('Good morning');
    expect(Core().getGreeting(11)).toBe('Good morning');
  });

  it('returns "Good afternoon" for hours 12–16', () => {
    expect(Core().getGreeting(12)).toBe('Good afternoon');
    expect(Core().getGreeting(16)).toBe('Good afternoon');
  });

  it('returns "Good evening" for hours 17–21', () => {
    expect(Core().getGreeting(17)).toBe('Good evening');
    expect(Core().getGreeting(21)).toBe('Good evening');
  });

  it('returns "Good night" for hours 22–23', () => {
    expect(Core().getGreeting(22)).toBe('Good night');
    expect(Core().getGreeting(23)).toBe('Good night');
  });

  it('covers every hour 0–23 with the expected greeting', () => {
    const expected = {
      0: 'Good night', 1: 'Good night', 2: 'Good night', 3: 'Good night', 4: 'Good night',
      5: 'Good morning', 6: 'Good morning', 7: 'Good morning', 8: 'Good morning',
      9: 'Good morning', 10: 'Good morning', 11: 'Good morning',
      12: 'Good afternoon', 13: 'Good afternoon', 14: 'Good afternoon',
      15: 'Good afternoon', 16: 'Good afternoon',
      17: 'Good evening', 18: 'Good evening', 19: 'Good evening', 20: 'Good evening', 21: 'Good evening',
      22: 'Good night', 23: 'Good night',
    };
    for (let h = 0; h < 24; h++) {
      expect(Core().getGreeting(h)).toBe(expected[h]);
    }
  });
});

describe('Core.computeRemaining', () => {
  it('returns the full duration when nothing elapsed', () => {
    expect(Core().computeRemaining(1500, 0)).toBe(1500);
  });

  it('subtracts elapsed from duration', () => {
    expect(Core().computeRemaining(1500, 500)).toBe(1000);
  });

  it('returns 0 when elapsed equals duration', () => {
    expect(Core().computeRemaining(1500, 1500)).toBe(0);
  });

  it('clamps to 0 and never goes negative', () => {
    expect(Core().computeRemaining(1500, 2000)).toBe(0);
    expect(Core().computeRemaining(0, 0)).toBe(0);
    expect(Core().computeRemaining(100, 9999)).toBe(0);
  });

  it('is monotonically non-increasing as elapsed grows', () => {
    for (let e = 0; e < 60; e++) {
      expect(Core().computeRemaining(60, e)).toBeGreaterThanOrEqual(
        Core().computeRemaining(60, e + 1)
      );
    }
  });
});

describe('Core.validateTask', () => {
  it('rejects empty and whitespace-only text', () => {
    expect(Core().validateTask('')).toEqual({ valid: false });
    expect(Core().validateTask('   ')).toEqual({ valid: false });
    expect(Core().validateTask('\t\n')).toEqual({ valid: false });
  });

  it('accepts a single non-whitespace character', () => {
    expect(Core().validateTask('a')).toEqual({ valid: true });
    expect(Core().validateTask('  a  ')).toEqual({ valid: true });
  });

  it('accepts exactly 200 characters and rejects 201', () => {
    expect(Core().validateTask('x'.repeat(200))).toEqual({ valid: true });
    expect(Core().validateTask('x'.repeat(201))).toEqual({ valid: false });
  });

  it('counts trimmed length, not raw length', () => {
    expect(Core().validateTask('  ' + 'x'.repeat(200) + '  ')).toEqual({ valid: true });
    expect(Core().validateTask('  ' + 'x'.repeat(201) + '  ')).toEqual({ valid: false });
  });
});

describe('Core.validateEdit', () => {
  it('rejects empty and whitespace-only text', () => {
    expect(Core().validateEdit('')).toEqual({ valid: false });
    expect(Core().validateEdit('   ')).toEqual({ valid: false });
  });

  it('accepts a single non-whitespace character', () => {
    expect(Core().validateEdit('a')).toEqual({ valid: true });
  });

  it('does not impose the 200-character add limit', () => {
    expect(Core().validateEdit('x'.repeat(201))).toEqual({ valid: true });
    expect(Core().validateEdit('x'.repeat(500))).toEqual({ valid: true });
  });
});

describe('Core.validateLinkLabel', () => {
  it('rejects empty and whitespace-only labels', () => {
    expect(Core().validateLinkLabel('')).toEqual({ valid: false });
    expect(Core().validateLinkLabel('   ')).toEqual({ valid: false });
  });

  it('accepts a one-character label', () => {
    expect(Core().validateLinkLabel('a')).toEqual({ valid: true });
  });

  it('accepts exactly 50 characters and rejects 51', () => {
    expect(Core().validateLinkLabel('x'.repeat(50))).toEqual({ valid: true });
    expect(Core().validateLinkLabel('x'.repeat(51))).toEqual({ valid: false });
  });

  it('counts trimmed length', () => {
    expect(Core().validateLinkLabel('  ' + 'x'.repeat(50) + '  ')).toEqual({ valid: true });
    expect(Core().validateLinkLabel('  ' + 'x'.repeat(51) + '  ')).toEqual({ valid: false });
  });
});

describe('Core.validateUrl', () => {
  it('accepts http and https URLs with a hostname', () => {
    expect(Core().validateUrl('http://example.com')).toEqual({ valid: true });
    expect(Core().validateUrl('https://example.com')).toEqual({ valid: true });
    expect(Core().validateUrl('https://example.com/path?q=1#frag')).toEqual({ valid: true });
    expect(Core().validateUrl('http://localhost:3000')).toEqual({ valid: true });
  });

  it('rejects non-http(s) schemes', () => {
    expect(Core().validateUrl('ftp://example.com')).toEqual({ valid: false });
    expect(Core().validateUrl('javascript:alert(1)')).toEqual({ valid: false });
    expect(Core().validateUrl('data:text/html,<html></html>')).toEqual({ valid: false });
    expect(Core().validateUrl('mailto:user@example.com')).toEqual({ valid: false });
  });

  it('rejects malformed URLs that fail to parse', () => {
    expect(Core().validateUrl('not a url')).toEqual({ valid: false });
    expect(Core().validateUrl('')).toEqual({ valid: false });
    expect(Core().validateUrl('//example.com')).toEqual({ valid: false });
  });

  it('rejects http/https URLs without a hostname', () => {
    expect(Core().validateUrl('http://')).toEqual({ valid: false });
    expect(Core().validateUrl('https://')).toEqual({ valid: false });
  });
});

describe('Core.sortTasks', () => {
  const task = (id, completed, createdAt) => ({
    id,
    text: 't' + id,
    completed,
    createdAt,
  });

  it('sorts incomplete tasks before complete tasks (completion)', () => {
    const tasks = [
      task('1', true, 1),
      task('2', false, 2),
      task('3', true, 3),
      task('4', false, 4),
    ];
    const sorted = Core().sortTasks(tasks, 'completion');
    expect(sorted.map((t) => t.id)).toEqual(['2', '4', '1', '3']);
  });

  it('breaks ties within a completion group by createdAt ascending', () => {
    const tasks = [
      task('1', false, 10),
      task('2', false, 5),
      task('3', true, 12),
      task('4', true, 8),
    ];
    const sorted = Core().sortTasks(tasks, 'completion');
    expect(sorted.map((t) => t.id)).toEqual(['2', '1', '4', '3']);
  });

  it('sorts by createdAt oldest to newest (created)', () => {
    const tasks = [
      task('3', false, 30),
      task('1', false, 10),
      task('2', true, 20),
    ];
    const sorted = Core().sortTasks(tasks, 'created');
    expect(sorted.map((t) => t.id)).toEqual(['1', '2', '3']);
  });

  it('does not mutate the input array and returns a new reference', () => {
    const tasks = [
      task('1', true, 2),
      task('2', false, 1),
    ];
    const snapshot = tasks.map((t) => ({ ...t }));
    const snapshotOrder = tasks.map((t) => t.id);
    const sorted = Core().sortTasks(tasks, 'completion');

    expect(tasks.map((t) => t.id)).toEqual(snapshotOrder);
    expect(tasks).toEqual(snapshot);
    expect(sorted).not.toBe(tasks);
  });

  it('handles an empty list', () => {
    expect(Core().sortTasks([], 'created')).toEqual([]);
    expect(Core().sortTasks([], 'completion')).toEqual([]);
  });

  it('handles a single-element list', () => {
    const tasks = [task('1', false, 1)];
    const sorted = Core().sortTasks(tasks, 'completion');
    expect(sorted.map((t) => t.id)).toEqual(['1']);
    expect(sorted).not.toBe(tasks);
  });
});
