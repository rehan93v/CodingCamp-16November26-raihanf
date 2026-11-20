# Implementation Plan: Todo List Life Dashboard

## Overview

This plan implements a client-side single-page productivity dashboard with four interactive widgets — a greeting clock, a Pomodoro focus timer, a to-do list, and quick website links — plus a light/dark theme toggle. The entire application is three files: `index.html` at the project root, `css/styles.css` for theming and layout, and `js/app.js` for all logic. JavaScript is organized into self-contained modules (IIFEs) within the single file: `Storage`, `Core` (pure functions), `GreetingWidget`, `FocusTimer`, `TaskList`, `QuickLinks`, `ThemeToggle`, and `App` (bootstrap). All data persists in Local Storage through the shared `Storage` abstraction.

Testing uses Vitest with fast-check for property-based testing of pure logic functions, plus example-based unit tests and integration tests for DOM interaction, persistence wiring, and timing. Pure functions are exposed on a `Core` namespace so property tests can call them directly without a DOM. Tests live in a `test/` directory and are dev dependencies only, preserving the framework-free constraint for the deployed application.

## Tasks

- [x] 1. Set up project structure and testing framework
  - [x] 1.1 Create index.html at the project root
    - Create the HTML file with semantic structure: a header containing the theme toggle button and greeting widget container, a main region with the focus timer and task list containers, and a footer/aside region with quick links container
    - Include `data-action` attributes on interactive elements and placeholder containers with IDs for each widget to render into
    - Link `css/styles.css` and `js/app.js`
    - _Requirements: 15.1, 15.2, 16.3_

  - [x] 1.2 Create css/styles.css in the css/ directory
    - Define CSS custom properties on `:root` for the light theme (background, surface, text, text-muted, accent, border, done-text, shadow) and override them under `[data-theme="dark"]` for the dark theme
    - Implement a responsive CSS Grid layout: Focus Timer and Task List side by side on wide viewports, stacked on narrow viewports
    - Style the greeting widget (large type for greeting, muted smaller text for time and date), focus timer (large countdown display, control buttons), task list (task rows with checkboxes, edit/delete buttons, sort dropdown, add input), quick links (button row with add form), and theme toggle (top-right corner button)
    - Add the completed-task visual style: strikethrough text with `--done-text` color
    - _Requirements: 1.1, 7.2, 13.1, 15.1, 16.1_

  - [x] 1.3 Set up test infrastructure
    - Create `package.json` with Vitest and fast-check as dev dependencies
    - Create `vitest.config.js` configured for DOM testing (jsdom environment)
    - Create a `test/` directory with a helper module that exports a Local Storage mock implementing `getItem`/`setItem`/`removeItem` with a configurable failure mode
    - _Requirements: 15.1_

  - [x] 1.4 Create js/app.js scaffold in the js/ directory
    - Create the file with an IIFE-based module structure: `Storage`, `Core`, `GreetingWidget`, `FocusTimer`, `TaskList`, `QuickLinks`, `ThemeToggle`, and `App` modules, each as a revealing module pattern with placeholder exports
    - Expose `Core` as a namespace object on `window` so test files can import and call pure functions directly
    - Add a `DOMContentLoaded` listener that calls `App.init()`
    - _Requirements: 15.1, 16.2_

- [x] 2. Implement Storage and Core pure functions
  - [x] 2.1 Implement the Storage module
    - Implement `Storage.isAvailable()`: probe Local Storage with a throwaway key write/read/delete, returning `true` only if no exception is thrown
    - Implement `Storage.get(key, defaultValue)`: read the key, `JSON.parse` the value, return `defaultValue` if the key is missing, the value is `null`, or parsing fails; wrap all access in `try/catch`
    - Implement `Storage.set(key, value)`: `JSON.stringify` the value and write it, returning `true` on success and `false` if Local Storage is unavailable or the write throws (`QuotaExceededError`, `SecurityError`)
    - Implement `Storage.remove(key)`: remove the key, returning `true` on success
    - Use the `tld.` prefix for all keys: `tld.tasks`, `tld.quickLinks`, `tld.pomodoroDuration`, `tld.theme`
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 2.2 Implement Core pure functions
    - Implement `Core.formatTime(date)`: return a 12-hour `hh:mm:ss AM/PM` string with zero-padded minutes and seconds, hour in 1–12, and AM/PM based on before/from noon
    - Implement `Core.formatDate(date)`: return a string with the full weekday name, full month name, day-of-month number, and four-digit year
    - Implement `Core.getGreeting(hour)`: return `"Good morning"` for hours 5–11, `"Good afternoon"` for hours 12–16, `"Good evening"` for hours 17–21, `"Good night"` for hours 22–23 or 0–4
    - Implement `Core.computeRemaining(durationSeconds, elapsedSeconds)`: return `Math.max(0, durationSeconds - elapsedSeconds)`
    - Implement `Core.validateTask(text)`: return `{ valid: true }` when trimmed length is ≥ 1 and ≤ 200, else `{ valid: false }`
    - Implement `Core.validateEdit(text)`: return `{ valid: true }` when trimmed length is ≥ 1, else `{ valid: false }`
    - Implement `Core.validateLinkLabel(label)`: return `{ valid: true }` when trimmed length is 1–50, else `{ valid: false }`
    - Implement `Core.validateUrl(url)`: use the `URL` constructor to parse, return `{ valid: true }` when protocol is `http:` or `https:` and hostname is non-empty, else `{ valid: false }`
    - Implement `Core.sortTasks(tasks, criteria)`: for `'completion'`, sort incomplete before complete with creation-order tie-break (oldest first); for `'created'`, sort by `createdAt` oldest to newest; return a new array (do not mutate input)
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 3.5, 3.7, 4.1, 4.2, 5.1, 5.2, 6.2, 6.3, 9.2, 9.3, 9.4, 12.1, 12.2_

  - [ ]* 2.3 Write property test for 12-hour time format
    - **Property 1: 12-hour time format**
    - **Validates: Requirements 1.1**
    - Generate arbitrary valid `Date` values; assert `Core.formatTime(date)` matches `hh:mm:ss AM/PM` where hour is 1–12, minutes and seconds are two-digit zero-padded, and AM/PM corresponds to the hour being before or from noon onward
    - Minimum 100 iterations with fast-check

  - [ ]* 2.4 Write property test for date format
    - **Property 2: Date format**
    - **Validates: Requirements 1.3**
    - Generate arbitrary valid `Date` values; assert `Core.formatDate(date)` contains the full weekday name, full month name, day-of-month number, and four-digit year
    - Minimum 100 iterations with fast-check

  - [ ]* 2.5 Write property test for greeting time ranges
    - **Property 3: Greeting matches time range**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Generate arbitrary hours 0–23; assert `Core.getGreeting(h)` returns the correct greeting per the defined ranges
    - Minimum 100 iterations with fast-check

  - [ ]* 2.6 Write property test for countdown computation
    - **Property 4: Countdown remaining is non-negative and monotonically decreasing**
    - **Validates: Requirements 3.5, 3.7**
    - Generate arbitrary non-negative integers for duration and elapsed; assert `Core.computeRemaining(d, e)` equals `max(0, d − e)`, is never negative, is monotonically non-increasing as `e` increases, and is exactly 0 for all `e ≥ d`
    - Minimum 100 iterations with fast-check

- [x] 3. Implement GreetingWidget
  - [x] 3.1 Implement the GreetingWidget module
    - Implement `GreetingWidget.init(container)`: cache DOM references for the time, date, and greeting elements within `container`, render immediately using `Core.formatTime`, `Core.formatDate`, and `Core.getGreeting` with the current date, and start a 1000 ms `setInterval` that re-renders on each tick
    - Implement `GreetingWidget.render()`: update the time, date, and greeting elements from the current `Date` using the Core helpers; the greeting automatically transitions when the hour crosses a range boundary
    - Implement `GreetingWidget.stop()`: clear the interval (used on teardown)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 3.2 Write unit tests for greeting widget
    - Test that the time display updates on each 1-second tick using fake timers
    - Test that the greeting transitions when the hour crosses a time-range boundary (e.g., 11:59 → 12:00 changes "Good morning" to "Good afternoon")
    - Test that the widget renders within 1 second of init
    - _Requirements: 1.2, 1.4, 2.5, 2.6_

- [x] 4. Implement FocusTimer
  - [x] 4.1 Implement the FocusTimer module
    - Implement `FocusTimer.init(container)`: cache DOM references (time display, start/stop/reset buttons, duration input), load the saved `Pomodoro_Duration` from `Storage.get('tld.pomodoroDuration', 25)`, set internal state (`duration`, `remaining` in seconds, `isRunning`, `isPaused`, `intervalId`), render the initial display as `mm:ss`, and wire button click handlers
    - Implement `FocusTimer.start()`: if running, no-op; if paused or idle, begin/resume the countdown via a 1000 ms `setInterval` that decrements `remaining` by 1 each tick, updating the display; when `remaining` reaches 0, stop the interval and set the state to complete
    - Implement `FocusTimer.pause()`: clear the interval, set `isPaused = true`, retain `remaining`
    - Implement `FocusTimer.reset()`: clear the interval, set `remaining` to `duration * 60`, set state to idle, render the duration
    - Implement `FocusTimer.setDuration(minutes)`: validate that `minutes` is an integer in 1–120 using Core logic; on success, set `duration`, save to `Storage.set('tld.pomodoroDuration', minutes)`, and update the display if not running; on failure, show a rejection indication (revert the input) and retain the previous duration
    - Implement `FocusTimer.render()`: display `remaining` as `mm:ss` (zero-padded)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ]* 4.2 Write property test for Pomodoro duration validation
    - **Property 5: Pomodoro duration validation**
    - **Validates: Requirements 4.1, 4.2**
    - Generate arbitrary numbers (integers and non-integers, in-range and out-of-range); assert `FocusTimer.setDuration(n)` accepts `n` if and only if `n` is an integer with 1 ≤ n ≤ 120; on rejection the previously set duration is retained; on acceptance the stored duration becomes `n`
    - Use a Local Storage mock; minimum 100 iterations with fast-check

  - [ ]* 4.3 Write unit tests for timer edge cases
    - Test that the default 25-minute duration is displayed on load when no saved duration exists
    - Test that reset returns the display to the current duration regardless of running/paused/complete state
    - Test that the countdown displays zero and stops when remaining reaches zero
    - Test that starting while paused resumes from retained remaining time
    - Test that the saved duration loads from Local Storage on init
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 4.4, 4.5_

- [x] 5. Implement TaskList
  - [x] 5.1 Implement the TaskList module
    - Implement `TaskList.init(container)`: cache DOM references (list container, add input, sort dropdown), load saved tasks from `Storage.get('tld.tasks', [])`, set in-memory state, render the list, and wire a single delegated click listener on the container that dispatches on `data-action` attributes (`toggle`, `edit`, `save`, `cancel`, `delete`) using `data-task-id` to identify the target
    - Implement `TaskList.add(text)`: validate with `Core.validateTask`; if valid, create a new `Task` object (`id: crypto.randomUUID()`, trimmed `text`, `completed: false`, `createdAt: Date.now()`), append to the in-memory list, call `Storage.set('tld.tasks', tasks)`, and re-render; if the save fails, retain the in-memory list and show an error message
    - Implement `TaskList.beginEdit(id)`: switch the task row to an editable input pre-filled with the current text
    - Implement `TaskList.saveEdit(id, newText)`: if `Core.validateEdit(newText)` is valid, update the task text (preserving `completed` and `createdAt`), save to Local Storage, and exit edit mode; if invalid, retain the original text and exit edit mode
    - Implement `TaskList.cancelEdit(id)`: retain the original text and exit edit mode
    - Implement `TaskList.toggleComplete(id)`: flip the task's `completed` status, save to Local Storage, and re-render
    - Implement `TaskList.remove(id)`: remove the task from the in-memory list, attempt `Storage.set`; if the save fails, restore the removed task to the list and show an error indicating the deletion could not be saved
    - Implement `TaskList.sort(criteria)`: call `Core.sortTasks` on the in-memory list with the given criteria (`'completion'` or `'created'`) and re-render
    - Implement `TaskList.render()`: rebuild the task row DOM from in-memory state, applying the completed visual style (strikethrough + `--done-text`) to completed tasks
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 6.4, 7.1, 7.2, 7.3, 8.1, 8.2, 8.3, 9.1, 9.2, 9.3, 9.4, 10.1, 10.3, 10.4, 10.5, 10.6_

  - [ ]* 5.2 Write property test for task validation and addition
    - **Property 6: Task validation and addition**
    - **Validates: Requirements 5.1, 5.2**
    - Generate arbitrary strings (including whitespace-only and >200 chars) and random task lists; assert that adding `s` succeeds if and only if trimmed length is 1–200; on success the list grows by exactly one, the new task has `completed === false`, and its `createdAt` is ≥ all existing `createdAt`; on failure the list is unchanged
    - Minimum 100 iterations with fast-check

  - [ ]* 5.3 Write property test for edit preservation
    - **Property 7: Edit preserves completion status, creation order, and rejects whitespace**
    - **Validates: Requirements 6.2, 6.3**
    - Generate arbitrary tasks and edited texts; assert saving an edit preserves `completed` and `createdAt`; if trimmed text length ≥ 1, `text` becomes the trimmed text; if trimmed text is empty, `text` remains original; the task exits edit mode in both cases
    - Minimum 100 iterations with fast-check

  - [ ]* 5.4 Write property test for completion toggle involution
    - **Property 8: Completion toggle is an involution**
    - **Validates: Requirements 7.1**
    - Generate arbitrary tasks; assert `toggle(toggle(t.completed)) === t.completed`
    - Minimum 100 iterations with fast-check

  - [ ]* 5.5 Write property test for delete exact removal
    - **Property 9: Delete removes exactly the target task**
    - **Validates: Requirements 8.1**
    - Generate random task lists and pick a task to delete; assert the list decreases by exactly one, the deleted task is gone, and every other task's text, completion status, and relative creation order are unchanged
    - Minimum 100 iterations with fast-check

  - [ ]* 5.6 Write property test for sort by completion with tie-break
    - **Property 10: Sort by completion with creation-order tie-break**
    - **Validates: Requirements 9.2, 9.4**
    - Generate random task lists; after sorting by `'completion'`, assert every incomplete task appears before every complete task, and within each group tasks are ordered by `createdAt` oldest to newest
    - Minimum 100 iterations with fast-check

  - [ ]* 5.7 Write property test for sort by creation order
    - **Property 11: Sort by creation is oldest-to-newest**
    - **Validates: Requirements 9.3**
    - Generate random task lists; after sorting by `'created'`, assert tasks are ordered by `createdAt` non-decreasing and the result is a permutation of the input
    - Minimum 100 iterations with fast-check

  - [ ]* 5.8 Write property test for task save/load round trip
    - **Property 12: Task list save/load round trip**
    - **Validates: Requirements 10.2, 10.3**
    - Generate random task lists with unique ids, valid texts, boolean completion, and numeric `createdAt`; serialize to the Local Storage mock and load back; assert the loaded list has matching text, completion status, and creation order for every task
    - Minimum 100 iterations with fast-check

  - [ ]* 5.9 Write unit tests for task edge cases
    - Test entering edit mode makes the task text editable (6.1)
    - Test canceling an edit retains the original text and exits edit mode (6.4)
    - Test a completed task receives the done visual style (7.2)
    - Test toggling a completed task back to incomplete removes the done style (7.3)
    - Test an empty task list displays when no saved tasks exist (10.6)
    - Test that a failed save after delete restores the task and shows an error (8.3)
    - Test that a failed save after add/toggle retains the list and shows an error (10.5, 14.3)
    - _Requirements: 6.1, 6.4, 7.2, 7.3, 8.3, 10.5, 10.6, 14.3_

- [x] 6. Implement QuickLinks
  - [x] 6.1 Implement the QuickLinks module
    - Implement `QuickLinks.init(container)`: cache DOM references (links container, add form with label and URL inputs), load saved links from `Storage.get('tld.quickLinks', [])`, render buttons, and wire a delegated click listener dispatching on `data-action` (`open`, `delete`) using `data-link-id`
    - Implement `QuickLinks.add(label, url)`: validate label with `Core.validateLinkLabel` and URL with `Core.validateUrl`; on success, create a new `QuickLink` (`id: crypto.randomUUID()`, trimmed `label`, `url`), append to the list, call `Storage.set('tld.quickLinks', links)`, and re-render; on failure, show an error indication near the add form and do not save
    - Implement `QuickLinks.remove(id)`: remove the link from the list, save to Local Storage, and re-render
    - Implement `QuickLinks.open(url)`: call `window.open(url, '_blank', 'noopener')` to open the URL in a new tab with the `noopener` security option
    - Implement `QuickLinks.render()`: rebuild one button per link, each displaying the link's label, with `data-link-id` and `data-action` attributes
    - _Requirements: 11.1, 11.2, 11.3, 12.1, 12.2, 12.3_

  - [ ]* 6.2 Write property test for quick link rendering
    - **Property 13: Quick link buttons render each label**
    - **Validates: Requirements 11.3**
    - Generate arbitrary sets of saved quick links; assert the rendered output contains exactly one button per link and each button displays the corresponding link's label
    - Minimum 100 iterations with fast-check

  - [ ]* 6.3 Write property test for quick link validation
    - **Property 14: Quick link validation**
    - **Validates: Requirements 12.1, 12.2**
    - Generate arbitrary label/URL pairs (valid and malformed); assert a link is accepted if and only if trimmed label length is 1–50 and `Core.validateUrl(url)` is true (http/https scheme with non-empty hostname); rejected links are not saved and the link list is unchanged
    - Minimum 100 iterations with fast-check

  - [ ]* 6.4 Write property test for delete exact removal of links
    - **Property 15: Delete removes exactly the target link**
    - **Validates: Requirements 12.3**
    - Generate random quick link lists and pick a link to delete; assert the list decreases by exactly one, the deleted link is gone, and every other link's label and URL are unchanged
    - Minimum 100 iterations with fast-check

  - [ ]* 6.5 Write unit tests for quick links
    - Test that clicking a link button opens the URL in a new tab via a spy on `window.open` with `noopener`
    - Test that a button is displayed for each saved link showing the label on load
    - _Requirements: 11.1, 11.3_

- [x] 7. Implement ThemeToggle
  - [x] 7.1 Implement the ThemeToggle module
    - Implement `ThemeToggle.init(button)`: cache the button reference, load the saved theme from `Storage.get('tld.theme', 'light')`, call `apply(theme)`, and wire the toggle click handler
    - Implement `ThemeToggle.toggle()`: switch to the opposite theme (`'light'` ↔ `'dark'`), call `apply`, reflect the active mode on the button (e.g., icon/text), and save to `Storage.set('tld.theme', theme)`; if the save fails, the theme is still applied for the session and an error is shown
    - Implement `ThemeToggle.apply(theme)`: set `document.documentElement.dataset.theme` to `theme` so CSS custom properties switch between light and dark
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ]* 7.2 Write property test for theme toggle involution
    - **Property 16: Theme toggle is an involution**
    - **Validates: Requirements 13.1**
    - Generate arbitrary starting themes (`'light'` or `'dark'`); assert `toggle(toggle(T)) === T` and each single toggle switches to the opposite theme
    - Minimum 100 iterations with fast-check

  - [ ]* 7.3 Write unit tests for theme defaults and persistence
    - Test that the default light theme is applied when no saved theme exists in Local Storage
    - Test that the saved theme loads and applies on init
    - Test that toggling saves the new theme to Local Storage
    - _Requirements: 13.2, 13.3, 13.4_

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Wire components and write integration tests
  - [x] 9.1 Implement the App bootstrap module
    - Implement `App.init()`: call `Storage.isAvailable()`; if unavailable, show a non-blocking error banner and continue with in-memory state; initialize `GreetingWidget`, `FocusTimer`, `TaskList`, `QuickLinks`, and `ThemeToggle` in order, passing each its container element; wire global delegated listeners if needed
    - Ensure `App.init` is called on `DOMContentLoaded`
    - Verify the complete application renders all five widgets and performs all user-facing operations without unhandled JavaScript errors
    - _Requirements: 1.4, 2.5, 10.1, 11.2, 13.3, 14.1, 14.2, 14.3, 15.1, 15.2, 17.1, 18.2_

  - [ ]* 9.2 Write integration tests for persistence wiring
    - Verify `Storage.set` is called with `tld.tasks` after task add, edit, toggle, and delete
    - Verify `Storage.set` is called with `tld.quickLinks` after quick link add and delete
    - Verify `Storage.set` is called with `tld.pomodoroDuration` after a duration change
    - Verify `Storage.set` is called with `tld.theme` after a theme toggle
    - Verify `Storage.get` is called for each key on load
    - _Requirements: 4.3, 5.3, 10.1, 10.4, 11.2, 12.1, 12.3, 13.2, 13.3_

  - [ ]* 9.3 Write integration tests for initialization and timers
    - Test that `App.init` initializes all five widgets and the shell renders without errors
    - Test that the greeting clock updates on each 1-second tick using fake timers
    - Test that the focus timer updates on each 1-second tick using fake timers
    - Test that a greeting boundary transition updates the displayed greeting within 1 second
    - _Requirements: 1.2, 2.6, 3.2, 3.7, 17.1, 18.2_

  - [ ]* 9.4 Write performance tests for responsiveness budget
    - Assert that display updates occur within 100 ms of synthetic interactions (add task, toggle complete, delete task, change duration, toggle theme) using performance marks
    - Assert that all widgets render within 2 seconds of load using performance marks
    - _Requirements: 18.1, 18.2_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- Integration tests verify persistence wiring, initialization, and timing behavior
- All JavaScript implementation goes into the single `js/app.js` file; implementation tasks are sequential because they modify the same file
- Property and unit test tasks write to separate test files in `test/` and can run in parallel with each other once their dependencies are met
- The `Core` namespace exposes pure functions on `window` so tests can import and call them without a DOM
- fast-check and Vitest are dev dependencies only; the deployed application remains framework-free (no external libraries bundled into `js/app.js`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "1.4"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 4, "tasks": ["4.1", "3.2"] },
    { "id": 5, "tasks": ["5.1", "4.2", "4.3"] },
    { "id": 6, "tasks": ["6.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9"] },
    { "id": 7, "tasks": ["7.1", "6.2", "6.3", "6.4", "6.5"] },
    { "id": 8, "tasks": ["9.1", "7.2", "7.3"] },
    { "id": 9, "tasks": ["9.2", "9.3", "9.4"] }
  ]
}
```
