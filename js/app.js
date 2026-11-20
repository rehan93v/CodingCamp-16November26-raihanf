/*
 * Todo List Life Dashboard — application logic
 *
 * This is the single JavaScript file for the dashboard (Requirement 16.2).
 * It is organized into self-contained modules using the revealing module
 * pattern (IIFEs): Storage, Core (pure functions), GreetingWidget, FocusTimer,
 * TaskList, QuickLinks, ThemeToggle, and App (bootstrap).
 *
 * NOTE: This file is a SCAFFOLD. Module public methods are placeholder stubs
 * (no-ops returning undefined). Actual logic is implemented in later tasks
 * (2.1, 2.2, 3.1, 4.1, 5.1, 6.1, 7.1, 9.1).
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Storage — Local Storage abstraction (implemented in task 2.1)       *
   * ------------------------------------------------------------------ */
  var Storage = (function () {
    var PROBE_KEY = 'tld.__probe__';

    // Returns true if Local Storage can be read and written.
    function isAvailable() {
      try {
        var ls = global.localStorage;
        if (!ls) {
          return false;
        }
        ls.setItem(PROBE_KEY, '1');
        ls.getItem(PROBE_KEY);
        ls.removeItem(PROBE_KEY);
        return true;
      } catch (e) {
        return false;
      }
    }

    // Reads and JSON.parses the value at key; returns defaultValue if the
    // key is missing, the value is null, or parsing fails.
    function get(key, defaultValue) {
      try {
        var raw = global.localStorage.getItem(key);
        if (raw === null) {
          return defaultValue;
        }
        var parsed = JSON.parse(raw);
        if (parsed === null) {
          return defaultValue;
        }
        return parsed;
      } catch (e) {
        return defaultValue;
      }
    }

    // JSON.stringifies value and writes it; returns true on success, false
    // if Local Storage is unavailable or the write throws.
    function set(key, value) {
      try {
        global.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    }

    // Removes the key; returns true on success.
    function remove(key) {
      try {
        global.localStorage.removeItem(key);
        return true;
      } catch (e) {
        return false;
      }
    }

    return {
      isAvailable: isAvailable,
      get: get,
      set: set,
      remove: remove
    };
  })();

  /* ------------------------------------------------------------------ *
   * Core — pure functions exposed for property-based testing           *
   * (implemented in task 2.2)                                          *
   * ------------------------------------------------------------------ */
  var Core = (function () {
    // Zero-pad a non-negative integer to two digits.
    function pad2(n) {
      return n < 10 ? '0' + n : '' + n;
    }

    // Zero-pad a non-negative integer to at least four digits.
    function pad4(n) {
      var s = '' + n;
      while (s.length < 4) {
        s = '0' + s;
      }
      return s;
    }

    // 12-hour hh:mm:ss AM/PM string. The hour is zero-padded to two digits and
    // in the 1–12 range (midnight and noon both render as 12).
    function formatTime(date) {
      var h = date.getHours();
      var ampm = h < 12 ? 'AM' : 'PM';
      var hour12 = h % 12;
      if (hour12 === 0) {
        hour12 = 12;
      }
      return (
        pad2(hour12) + ':' +
        pad2(date.getMinutes()) + ':' +
        pad2(date.getSeconds()) + ' ' +
        ampm
      );
    }

    // Weekday, Month Day, Year string with locale-independent full names and a
    // year rendered with at least four digits.
    function formatDate(date) {
      var days = [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday',
        'Thursday', 'Friday', 'Saturday'
      ];
      var months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      var year = date.getFullYear();
      var yearStr = (year < 0 ? '-' : '') + pad4(Math.abs(year));
      return (
        days[date.getDay()] + ', ' +
        months[date.getMonth()] + ' ' +
        date.getDate() + ', ' +
        yearStr
      );
    }

    // Time-of-day greeting for hour 0–23.
    function getGreeting(hour) {
      if (hour >= 5 && hour <= 11) {
        return 'Good morning';
      }
      if (hour >= 12 && hour <= 16) {
        return 'Good afternoon';
      }
      if (hour >= 17 && hour <= 21) {
        return 'Good evening';
      }
      return 'Good night';
    }

    // max(0, durationSeconds - elapsedSeconds); never negative.
    function computeRemaining(durationSeconds, elapsedSeconds) {
      return Math.max(0, durationSeconds - elapsedSeconds);
    }

    // { valid: bool } — valid when the trimmed length is 1–200 (inclusive).
    function validateTask(text) {
      var len = (text == null ? '' : String(text)).trim().length;
      return { valid: len >= 1 && len <= 200 };
    }

    // { valid: bool } — valid when the trimmed length is >= 1.
    function validateEdit(text) {
      var len = (text == null ? '' : String(text)).trim().length;
      return { valid: len >= 1 };
    }

    // { valid: bool } — valid when the trimmed length is 1–50 (inclusive).
    function validateLinkLabel(label) {
      var len = (label == null ? '' : String(label)).trim().length;
      return { valid: len >= 1 && len <= 50 };
    }

    // { valid: bool } — valid when the URL parses with an http: or https:
    // protocol and a non-empty hostname.
    function validateUrl(url) {
      try {
        var parsed = new URL(url);
        return {
          valid:
            (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
            parsed.hostname.length > 0
        };
      } catch (e) {
        return { valid: false };
      }
    }

    // Sorted copy of tasks by 'completion' or 'created'. The input array is
    // not mutated; a shallow copy is sorted and returned.
    function sortTasks(tasks, criteria) {
      var copy = tasks.slice();
      if (criteria === 'completion') {
        copy.sort(function (a, b) {
          if (a.completed !== b.completed) {
            // Incomplete (completed === false) sorts before complete.
            return a.completed ? 1 : -1;
          }
          return a.createdAt - b.createdAt;
        });
      } else if (criteria === 'created') {
        copy.sort(function (a, b) {
          return a.createdAt - b.createdAt;
        });
      }
      return copy;
    }

    return {
      formatTime: formatTime,
      formatDate: formatDate,
      getGreeting: getGreeting,
      computeRemaining: computeRemaining,
      validateTask: validateTask,
      validateEdit: validateEdit,
      validateLinkLabel: validateLinkLabel,
      validateUrl: validateUrl,
      sortTasks: sortTasks
    };
  })();

  /* ------------------------------------------------------------------ *
   * GreetingWidget — time/date/greeting display (implemented task 3.1) *
   * ------------------------------------------------------------------ */
  var GreetingWidget = (function () {
    // Closure-private module state: cached DOM refs and the render interval id.
    var greetingEl = null;
    var timeEl = null;
    var dateEl = null;
    var intervalId = null;

    // Cache DOM refs within container, render immediately, start interval.
    function init(container) {
      greetingEl = container.querySelector('#greeting-text');
      timeEl = container.querySelector('#greeting-time');
      dateEl = container.querySelector('#greeting-date');
      render();
      intervalId = setInterval(render, 1000);
    }

    // Update time, date, and greeting elements from the current Date.
    // The greeting transitions automatically when the hour crosses a range
    // boundary because getGreeting is derived from the current hour each tick.
    function render() {
      // Defensive guard: if refs were not cached (e.g. init not called), exit
      // early so direct calls from tests don't throw.
      if (!greetingEl || !timeEl || !dateEl) {
        return;
      }
      var date = new Date();
      greetingEl.textContent = Core.getGreeting(date.getHours());
      timeEl.textContent = Core.formatTime(date);
      dateEl.textContent = Core.formatDate(date);
    }

    // Clear the interval (teardown).
    function stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }

    return {
      init: init,
      render: render,
      stop: stop
    };
  })();

  /* ------------------------------------------------------------------ *
   * FocusTimer — Pomodoro countdown (implemented in task 4.1)          *
   * ------------------------------------------------------------------ */
  var FocusTimer = (function () {
    // Closure-private module state: cached DOM refs and countdown state.
    var displayEl = null;
    var startBtn = null;
    var stopBtn = null;
    var resetBtn = null;
    var durationInput = null;
    var messageEl = null;
    var duration = 25;      // Pomodoro_Duration in minutes (Requirement 4.5 default).
    var remaining = 0;     // Remaining seconds in the current countdown.
    var isRunning = false;  // True while the interval is ticking.
    var isPaused = false;   // True after an explicit pause (retains remaining).
    var intervalId = null;  // setInterval handle, or null when not running.

    // Cache DOM refs, load saved duration (or default 25), render, wire buttons.
    function init(container) {
      // Defensive: ignore a missing container without throwing.
      if (!container) {
        return;
      }
      // Clear any running interval before (re-)initialising so re-init is safe.
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }

      // Cache DOM references within the focus-timer container.
      displayEl = container.querySelector('#timer-display');
      startBtn = container.querySelector('[data-action="start"]');
      stopBtn = container.querySelector('[data-action="stop"]');
      resetBtn = container.querySelector('[data-action="reset"]');
      durationInput = container.querySelector('#timer-duration-input');
      messageEl = container.querySelector('#timer-message');

      // Requirement 4.4: load saved Pomodoro_Duration from Local Storage.
      // Requirement 4.5: default to 25 minutes when none is saved.
      var saved = Storage.get('tld.pomodoroDuration', 25);
      // Defensive: coerce an invalid stored value back to the default.
      if (!Number.isInteger(saved) || saved < 1 || saved > 120) {
        saved = 25;
      }
      duration = saved;
      remaining = duration * 60;
      isRunning = false;
      isPaused = false;
      intervalId = null;

      // Reflect the loaded duration in the input control and clear messages.
      if (durationInput) {
        durationInput.value = String(duration);
      }
      if (messageEl) {
        messageEl.textContent = '';
      }

      // Requirement 3.1: render the initial display (default 25 min on load).
      render();

      // Wire control buttons (Requirement 3.2 start, 3.3 stop, 3.4 reset).
      if (startBtn) {
        startBtn.addEventListener('click', start);
      }
      if (stopBtn) {
        stopBtn.addEventListener('click', pause);
      }
      if (resetBtn) {
        resetBtn.addEventListener('click', reset);
      }
      // Wire the duration input change handler (Requirement 4.1).
      if (durationInput) {
        durationInput.addEventListener('change', function () {
          setDuration(Number(durationInput.value));
        });
      }
    }

    // One-second tick: decrement remaining, stop at zero (Requirement 3.7, 3.5).
    function tick() {
      remaining = remaining - 1;
      if (remaining <= 0) {
        remaining = 0;
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
        isRunning = false;
        // State is now Complete (remaining == 0, not running, not paused).
      }
      render();
    }

    // Begin or resume the countdown (Requirement 3.2, 3.6).
    function start() {
      // Defensive: no-op if the module was not initialised.
      if (!displayEl) {
        return;
      }
      // Starting while already running is a no-op (state machine).
      if (isRunning) {
        return;
      }
      // Complete -> Running: start a fresh session from the current duration.
      if (remaining <= 0) {
        remaining = duration * 60;
      }
      isRunning = true;
      isPaused = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      intervalId = setInterval(tick, 1000);
      render();
    }

    // Pause the countdown, retaining remaining time (Requirement 3.3).
    function pause() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      isRunning = false;
      isPaused = true;
    }

    // Stop and reset the display to the current duration (Requirement 3.4).
    function reset() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      remaining = duration * 60;
      isRunning = false;
      isPaused = false;
      render();
    }

    // Validate and set a new duration (1–120 whole minutes).
    // Requirement 4.1 (accept), 4.2 (reject + retain), 4.3 (save).
    function setDuration(minutes) {
      // Accept iff minutes is an integer in the range 1–120 inclusive.
      if (!Number.isInteger(minutes) || minutes < 1 || minutes > 120) {
        // Requirement 4.2: reject, revert the input, retain previous duration.
        if (durationInput) {
          durationInput.value = String(duration);
        }
        if (messageEl) {
          messageEl.textContent =
            'Duration must be a whole number between 1 and 120 minutes.';
        }
        return false;
      }

      // Accepted: apply the in-memory duration for the current session.
      duration = minutes;
      // Clear any prior rejection message.
      if (messageEl) {
        messageEl.textContent = '';
      }
      // Requirement 4.3: save the duration to Local Storage.
      var saved = Storage.set('tld.pomodoroDuration', minutes);
      if (!saved && messageEl) {
        // Per design: a failed save still applies for the session but surfaces
        // a non-blocking error (Requirement 14.3).
        messageEl.textContent =
          'Could not save the duration; it will apply for this session only.';
      }
      // Reflect the accepted value in the input control.
      if (durationInput) {
        durationInput.value = String(duration);
      }
      // When not running, reset remaining to the new duration and re-render.
      if (!isRunning) {
        remaining = duration * 60;
        render();
      }
      return true;
    }

    // Display remaining time as mm:ss, zero-padded (Requirement 3.7, 3.5).
    function render() {
      // Defensive: exit early if the display element is missing.
      if (!displayEl) {
        return;
      }
      var secs = remaining;
      if (typeof secs !== 'number' || !isFinite(secs) || secs < 0) {
        secs = 0;
      }
      secs = Math.floor(secs);
      var m = Math.floor(secs / 60);
      var s = secs % 60;
      var mm = m < 10 ? '0' + m : '' + m;
      var ss = s < 10 ? '0' + s : '' + s;
      displayEl.textContent = mm + ':' + ss;
    }

    return {
      init: init,
      start: start,
      pause: pause,
      reset: reset,
      setDuration: setDuration,
      render: render
    };
  })();

  /* ------------------------------------------------------------------ *
   * TaskList — to-do list management (implemented in task 5.1)        *
   * ------------------------------------------------------------------ */
  var TaskList = (function () {
    // Closure-private module state.
    var containerEl = null;    // Widget container element.
    var listEl = null;         // <ul> that holds task rows.
    var inputEl = null;        // Text input for adding new tasks.
    var sortSelect = null;     // Sort-by dropdown.
    var messageEl = null;      // Error/info message element.
    var tasks = [];            // In-memory task list.
    var currentSort = 'created'; // Current sort criteria.
    var editingId = null;      // ID of the task currently being edited, or null.

    // ---- Helpers ----

    // Find a task by id; returns the task object or undefined.
    function findTask(id) {
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
          return tasks[i];
        }
      }
      return undefined;
    }

    // Find the index of a task by id; returns -1 if not found.
    function findIndex(id) {
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === id) {
          return i;
        }
      }
      return -1;
    }

    // Persist the in-memory task list; returns true on success.
    function persist() {
      return Storage.set('tld.tasks', tasks);
    }

    // Show a message in the task message area.
    function showMessage(msg) {
      if (messageEl) {
        messageEl.textContent = msg;
      }
    }

    // Clear the message area.
    function clearMessage() {
      if (messageEl) {
        messageEl.textContent = '';
      }
    }

    // ---- Public API ----

    // Cache DOM refs, load saved tasks, render, wire delegated events.
    function init(container) {
      if (!container) {
        return;
      }
      containerEl = container;
      listEl = container.querySelector('#task-items');
      inputEl = container.querySelector('#task-input');
      sortSelect = container.querySelector('#task-sort-select');
      messageEl = container.querySelector('#task-message');

      // Load saved tasks from Local Storage (Requirement 10.1).
      // Requirement 10.6: defaults to empty list when none are saved.
      tasks = Storage.get('tld.tasks', []);
      // Defensive: ensure tasks is an array.
      if (!Array.isArray(tasks)) {
        tasks = [];
      }

      currentSort = 'created';
      editingId = null;
      if (sortSelect) {
        sortSelect.value = currentSort;
      }
      clearMessage();

      render();

      // Wire delegated click listener on the list container for task actions.
      if (listEl) {
        listEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-action]');
          if (!btn) {
            return;
          }
          var action = btn.getAttribute('data-action');
          var taskId = btn.getAttribute('data-task-id');
          if (!taskId) {
            // Also check parent li for task id.
            var li = btn.closest('[data-task-id]');
            if (li) {
              taskId = li.getAttribute('data-task-id');
            }
          }
          if (!taskId) {
            return;
          }

          if (action === 'toggle') {
            toggleComplete(taskId);
          } else if (action === 'edit') {
            beginEdit(taskId);
          } else if (action === 'delete') {
            remove(taskId);
          } else if (action === 'save') {
            // Find the edit input for this task.
            var editInput = listEl.querySelector(
              'input[data-edit-id="' + taskId + '"]'
            );
            var newText = editInput ? editInput.value : '';
            saveEdit(taskId, newText);
          } else if (action === 'cancel') {
            cancelEdit(taskId);
          }
        });

        // Also handle Enter key in edit inputs via keydown delegation.
        listEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            var editInput = e.target.closest('input[data-edit-id]');
            if (editInput) {
              var taskId = editInput.getAttribute('data-edit-id');
              saveEdit(taskId, editInput.value);
            }
          } else if (e.key === 'Escape') {
            var editInput2 = e.target.closest('input[data-edit-id]');
            if (editInput2) {
              var taskId2 = editInput2.getAttribute('data-edit-id');
              cancelEdit(taskId2);
            }
          }
        });
      }

      // Wire add button and Enter key on the add input.
      var addBtn = container.querySelector('[data-action="add"]');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          if (inputEl) {
            add(inputEl.value);
          }
        });
      }
      if (inputEl) {
        inputEl.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            add(inputEl.value);
          }
        });
      }

      // Wire sort dropdown change.
      if (sortSelect) {
        sortSelect.addEventListener('change', function () {
          sort(sortSelect.value);
        });
      }
    }

    // Validate text; if valid, append a new incomplete task, save, re-render.
    // Requirement 5.1 (add), 5.2 (reject), 5.3 (save).
    function add(text) {
      clearMessage();
      if (!Core.validateTask(text).valid) {
        // Requirement 5.2: do not add; keep input so user can correct.
        showMessage('Task text must be 1–200 non-whitespace characters.');
        return;
      }
      var task = {
        id: crypto.randomUUID(),
        text: String(text).trim(),
        completed: false,
        createdAt: Date.now()
      };
      tasks.push(task);
      var saved = persist();
      if (!saved) {
        // Requirement 10.5, 14.3: retain in-memory list, show error.
        showMessage('Could not save; your changes will apply for this session only.');
      }
      // Clear the add input on success.
      if (inputEl) {
        inputEl.value = '';
      }
      render();
    }

    // Switch the task row to an editable input (Requirement 6.1).
    function beginEdit(id) {
      clearMessage();
      editingId = id;
      render();
      // Focus the edit input.
      if (listEl) {
        var editInput = listEl.querySelector(
          'input[data-edit-id="' + id + '"]'
        );
        if (editInput) {
          editInput.focus();
          editInput.select();
        }
      }
    }

    // Save edited text (Requirement 6.2, 6.3).
    function saveEdit(id, newText) {
      var task = findTask(id);
      if (!task) {
        editingId = null;
        render();
        return;
      }
      if (Core.validateEdit(newText).valid) {
        // Valid: update text, preserve completed and createdAt.
        task.text = String(newText).trim();
        var saved = persist();
        if (!saved) {
          showMessage('Could not save; your changes will apply for this session only.');
        }
      }
      // Invalid or valid: exit edit mode (6.3 retains original text if invalid).
      editingId = null;
      render();
    }

    // Cancel edit: retain original text and exit edit mode (Requirement 6.4).
    function cancelEdit(id) {
      editingId = null;
      render();
    }

    // Toggle completion status, save, re-render (Requirement 7.1).
    function toggleComplete(id) {
      clearMessage();
      var task = findTask(id);
      if (!task) {
        return;
      }
      task.completed = !task.completed;
      var saved = persist();
      if (!saved) {
        showMessage('Could not save; your changes will apply for this session only.');
      }
      render();
    }

    // Remove the task; if save fails, restore and show error (Requirement 8.1, 8.2, 8.3).
    function remove(id) {
      clearMessage();
      var idx = findIndex(id);
      if (idx === -1) {
        return;
      }
      // Remove from in-memory list.
      var removed = tasks.splice(idx, 1)[0];
      var saved = persist();
      if (!saved) {
        // Requirement 8.3: restore the removed task and show error.
        tasks.splice(idx, 0, removed);
        showMessage('Could not save the deletion; the task has been restored.');
        render();
        return;
      }
      render();
    }

    // Sort displayed tasks by criteria (Requirement 9.1, 9.2, 9.3, 9.4).
    function sort(criteria) {
      currentSort = criteria;
      render();
    }

    // Rebuild the task row DOM from in-memory state.
    function render() {
      if (!listEl) {
        return;
      }
      // Sort tasks according to the current sort criteria.
      var sorted = Core.sortTasks(tasks, currentSort);

      listEl.innerHTML = '';
      for (var i = 0; i < sorted.length; i++) {
        var task = sorted[i];
        var li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' task-done' : '');
        li.setAttribute('data-task-id', task.id);

        if (editingId === task.id) {
          // ---- Edit mode ----
          var editInput = document.createElement('input');
          editInput.type = 'text';
          editInput.className = 'task-edit-input';
          editInput.value = task.text;
          editInput.setAttribute('data-edit-id', task.id);
          editInput.maxLength = 200;

          var saveBtn = document.createElement('button');
          saveBtn.type = 'button';
          saveBtn.className = 'task-action-btn';
          saveBtn.setAttribute('data-action', 'save');
          saveBtn.setAttribute('data-task-id', task.id);
          saveBtn.textContent = 'Save';

          var cancelBtn = document.createElement('button');
          cancelBtn.type = 'button';
          cancelBtn.className = 'task-action-btn';
          cancelBtn.setAttribute('data-action', 'cancel');
          cancelBtn.setAttribute('data-task-id', task.id);
          cancelBtn.textContent = 'Cancel';

          li.appendChild(editInput);
          li.appendChild(saveBtn);
          li.appendChild(cancelBtn);
        } else {
          // ---- Display mode ----
          // Checkbox for toggling completion.
          var checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'task-checkbox';
          checkbox.checked = task.completed;
          checkbox.setAttribute('data-action', 'toggle');
          checkbox.setAttribute('data-task-id', task.id);
          checkbox.setAttribute('aria-label', 'Mark "' + task.text + '" as ' +
            (task.completed ? 'incomplete' : 'complete'));

          // Task text span.
          var textSpan = document.createElement('span');
          textSpan.className = 'task-text';
          textSpan.textContent = task.text;

          // Edit button.
          var editBtn = document.createElement('button');
          editBtn.type = 'button';
          editBtn.className = 'task-action-btn';
          editBtn.setAttribute('data-action', 'edit');
          editBtn.setAttribute('data-task-id', task.id);
          editBtn.textContent = 'Edit';

          // Delete button.
          var deleteBtn = document.createElement('button');
          deleteBtn.type = 'button';
          deleteBtn.className = 'task-action-btn task-delete-btn';
          deleteBtn.setAttribute('data-action', 'delete');
          deleteBtn.setAttribute('data-task-id', task.id);
          deleteBtn.textContent = 'Delete';

          li.appendChild(checkbox);
          li.appendChild(textSpan);
          li.appendChild(editBtn);
          li.appendChild(deleteBtn);
        }

        listEl.appendChild(li);
      }
    }

    return {
      init: init,
      add: add,
      beginEdit: beginEdit,
      saveEdit: saveEdit,
      cancelEdit: cancelEdit,
      toggleComplete: toggleComplete,
      remove: remove,
      sort: sort,
      render: render
    };
  })();

  /* ------------------------------------------------------------------ *
   * QuickLinks — bookmark buttons (implemented in task 6.1)           *
   * ------------------------------------------------------------------ */
  var QuickLinks = (function () {
    // Closure-private module state.
    var containerEl = null;    // Widget container element.
    var itemsEl = null;        // Container for link buttons.
    var labelInput = null;     // Label text input.
    var urlInput = null;       // URL text input.
    var messageEl = null;      // Error/info message element.
    var links = [];            // In-memory quick links list.

    // ---- Helpers ----

    // Persist the in-memory links list; returns true on success.
    function persist() {
      return Storage.set('tld.quickLinks', links);
    }

    // Show a message in the quick-link message area.
    function showMessage(msg) {
      if (messageEl) {
        messageEl.textContent = msg;
      }
    }

    // Clear the message area.
    function clearMessage() {
      if (messageEl) {
        messageEl.textContent = '';
      }
    }

    // ---- Public API ----

    // Cache DOM refs, load saved links, render buttons, wire events.
    function init(container) {
      if (!container) {
        return;
      }
      containerEl = container;
      itemsEl = container.querySelector('#quick-links-items');
      labelInput = container.querySelector('#quick-link-label-input');
      urlInput = container.querySelector('#quick-link-url-input');
      messageEl = container.querySelector('#quick-link-message');

      // Load saved links from Local Storage (Requirement 11.2).
      links = Storage.get('tld.quickLinks', []);
      if (!Array.isArray(links)) {
        links = [];
      }

      clearMessage();
      render();

      // Wire delegated click listener on the items container for open/delete.
      if (itemsEl) {
        itemsEl.addEventListener('click', function (e) {
          var btn = e.target.closest('[data-action]');
          if (!btn) {
            return;
          }
          var action = btn.getAttribute('data-action');
          var linkId = btn.getAttribute('data-link-id');

          if (action === 'open') {
            // Find the link by id and open its URL.
            for (var i = 0; i < links.length; i++) {
              if (links[i].id === linkId) {
                openUrl(links[i].url);
                break;
              }
            }
          } else if (action === 'delete-link') {
            remove(linkId);
          }
        });
      }

      // Wire add-link button.
      var addBtn = container.querySelector('[data-action="add-link"]');
      if (addBtn) {
        addBtn.addEventListener('click', function () {
          var label = labelInput ? labelInput.value : '';
          var url = urlInput ? urlInput.value : '';
          add(label, url);
        });
      }
    }

    // Validate label and URL; on success add and save; on failure show error.
    // Requirement 12.1 (accept), 12.2 (reject).
    function add(label, url) {
      clearMessage();

      var labelValid = Core.validateLinkLabel(label);
      var urlValid = Core.validateUrl(url);

      if (!labelValid.valid) {
        showMessage('Label must be 1–50 characters.');
        return;
      }
      if (!urlValid.valid) {
        showMessage('URL must use http:// or https:// with a valid domain.');
        return;
      }

      var link = {
        id: crypto.randomUUID(),
        label: String(label).trim(),
        url: String(url).trim()
      };
      links.push(link);

      var saved = persist();
      if (!saved) {
        showMessage('Could not save; your changes will apply for this session only.');
      }

      // Clear inputs on success.
      if (labelInput) {
        labelInput.value = '';
      }
      if (urlInput) {
        urlInput.value = '';
      }
      render();
    }

    // Remove the link and save (Requirement 12.3).
    function remove(id) {
      clearMessage();
      for (var i = 0; i < links.length; i++) {
        if (links[i].id === id) {
          links.splice(i, 1);
          break;
        }
      }
      var saved = persist();
      if (!saved) {
        showMessage('Could not save the deletion.');
      }
      render();
    }

    // Open url in a new tab (Requirement 11.1).
    function openUrl(url) {
      window.open(url, '_blank', 'noopener');
    }

    // Rebuild one button per link (Requirement 11.3).
    function render() {
      if (!itemsEl) {
        return;
      }
      itemsEl.innerHTML = '';
      for (var i = 0; i < links.length; i++) {
        var link = links[i];

        var wrapper = document.createElement('span');
        wrapper.className = 'quick-link-item';

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quick-link-btn';
        btn.setAttribute('data-action', 'open');
        btn.setAttribute('data-link-id', link.id);
        btn.textContent = link.label;

        var delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'quick-link-delete-btn';
        delBtn.setAttribute('data-action', 'delete-link');
        delBtn.setAttribute('data-link-id', link.id);
        delBtn.textContent = '×';
        delBtn.setAttribute('aria-label', 'Delete ' + link.label);

        wrapper.appendChild(btn);
        wrapper.appendChild(delBtn);
        itemsEl.appendChild(wrapper);
      }
    }

    return {
      init: init,
      add: add,
      remove: remove,
      open: openUrl,
      render: render
    };
  })();

  /* ------------------------------------------------------------------ *
   * ThemeToggle — light/dark mode (implemented in task 7.1)           *
   * ------------------------------------------------------------------ */
  var ThemeToggle = (function () {
    // Closure-private module state.
    var buttonEl = null;       // The toggle button element.
    var currentTheme = 'light'; // Current theme: 'light' or 'dark'.

    // ---- Public API ----

    // Cache button, load saved theme (default light), apply, wire toggle.
    // Requirement 13.3 (load saved), 13.4 (default light).
    function init(button) {
      if (!button) {
        return;
      }
      buttonEl = button;

      // Load saved theme from Local Storage.
      var saved = Storage.get('tld.theme', 'light');
      if (saved !== 'light' && saved !== 'dark') {
        saved = 'light';
      }
      currentTheme = saved;
      apply(currentTheme);
      reflectIcon();

      // Wire the toggle click handler.
      buttonEl.addEventListener('click', toggle);
    }

    // Switch to the opposite mode, apply, reflect, save.
    // Requirement 13.1 (toggle), 13.2 (save).
    function toggle() {
      currentTheme = currentTheme === 'light' ? 'dark' : 'light';
      apply(currentTheme);
      reflectIcon();

      var saved = Storage.set('tld.theme', currentTheme);
      if (!saved) {
        // Theme still applied for the session; surface a non-blocking warning.
        // We don't have a dedicated message element for theme, so we'll just
        // keep the theme applied and silently continue.
      }
    }

    // Set document.documentElement.dataset.theme (Requirement 13.1).
    function apply(theme) {
      if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.dataset.theme = theme;
      }
    }

    // Update the button icon to reflect the current theme.
    function reflectIcon() {
      if (!buttonEl) {
        return;
      }
      var iconEl = buttonEl.querySelector('.theme-toggle-icon');
      if (iconEl) {
        // Show sun (☀) in dark mode (to switch to light), moon (🌙) in light mode.
        iconEl.textContent = currentTheme === 'dark' ? '☀' : '🌙';
      }
      buttonEl.setAttribute('aria-label',
        currentTheme === 'dark'
          ? 'Switch to light theme'
          : 'Switch to dark theme'
      );
    }

    return {
      init: init,
      toggle: toggle,
      apply: apply
    };
  })();

  /* ------------------------------------------------------------------ *
   * App — bootstrap (implemented in task 9.1)                          *
   * ------------------------------------------------------------------ */
  var App = (function () {
    // Check Storage.isAvailable(); initialize all widgets in order; wire
    // global delegated listeners. Called on DOMContentLoaded.
    // Requirement 1.4, 2.5, 10.1, 11.2, 13.3, 14.1, 14.2, 14.3, 15.1, 15.2, 17.1, 18.2.
    function init() {
      // Requirement 14.1, 14.3: check Local Storage availability.
      // If unavailable, show a non-blocking error banner but continue
      // with in-memory state so the app remains functional.
      if (!Storage.isAvailable()) {
        var banner = document.createElement('div');
        banner.className = 'storage-banner';
        banner.setAttribute('role', 'alert');
        banner.textContent =
          'Local Storage is unavailable. Your data will not be saved between sessions.';
        // Insert the banner at the top of the body so it's immediately visible.
        document.body.insertBefore(banner, document.body.firstChild);
      }

      // Initialize all five widgets in order, passing each its container
      // element from the DOM.

      // 1. ThemeToggle — apply the saved (or default) theme first so all
      //    subsequent widget rendering uses the correct colour scheme.
      //    Requirement 13.3, 13.4.
      var themeBtn = document.getElementById('theme-toggle');
      ThemeToggle.init(themeBtn);

      // 2. GreetingWidget — time, date, and greeting display.
      //    Requirement 1.4, 2.5.
      var greetingContainer = document.getElementById('greeting-widget');
      GreetingWidget.init(greetingContainer);

      // 3. FocusTimer — Pomodoro countdown.
      //    Requirement 3.1, 4.4, 4.5.
      var timerContainer = document.getElementById('focus-timer');
      FocusTimer.init(timerContainer);

      // 4. TaskList — to-do list.
      //    Requirement 10.1, 10.6.
      var taskContainer = document.getElementById('task-list');
      TaskList.init(taskContainer);

      // 5. QuickLinks — favourite website buttons.
      //    Requirement 11.2, 11.3.
      var linksContainer = document.getElementById('quick-links');
      QuickLinks.init(linksContainer);
    }

    return {
      init: init
    };
  })();

  /* ------------------------------------------------------------------ *
   * Expose modules on the global object for use by the app and tests.  *
   * window.Core is the critical export for property-based testing.    *
   * ------------------------------------------------------------------ */
  global.Storage = Storage;
  global.Core = Core;
  global.GreetingWidget = GreetingWidget;
  global.FocusTimer = FocusTimer;
  global.TaskList = TaskList;
  global.QuickLinks = QuickLinks;
  global.ThemeToggle = ThemeToggle;
  global.App = App;

  /* ------------------------------------------------------------------ *
   * Boot — call App.init() once the DOM is ready.                       *
   * ------------------------------------------------------------------ */
  function boot() {
    App.init();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      // DOM already parsed (script loaded after DOMContentLoaded).
      boot();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
