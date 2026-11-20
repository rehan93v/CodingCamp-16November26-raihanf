# Requirements Document

## Introduction

The Todo List Life Dashboard is a client-side web application that serves as a personal productivity dashboard. It combines a time-based greeting, a Pomodoro focus timer, a to-do list, and quick links to favorite websites. All data is stored client-side using the browser's Local Storage API, so no backend server is required. The application is built with HTML, CSS, and vanilla JavaScript, with no frameworks. The interface is clean, minimal, and easy to use, and it supports a light/dark theme toggle.

## Glossary

- **Dashboard**: The Todo List Life Dashboard web application as a whole.
- **Local_Storage**: The browser Web Storage API used for client-side data persistence.
- **Greeting_Widget**: The component that displays the current time, date, and a time-of-day greeting.
- **Focus_Timer**: The Pomodoro-style countdown timer component.
- **Pomodoro_Duration**: The configurable length of the focus timer countdown period, measured in minutes.
- **Task_List**: The to-do list component that manages tasks.
- **Task**: A single to-do item consisting of text, a completion status, and a creation order.
- **Quick_Links**: The component that stores and displays buttons linking to favorite websites.
- **Theme_Toggle**: The component that switches the Dashboard between light and dark visual themes.

## Requirements

### Requirement 1: Display Current Time and Date

**User Story:** As a user, I want to see the current time and date, so that I can keep track of the time at a glance.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current local time in 12-hour format showing hours, minutes, and seconds with an AM/PM indicator.
2. THE Greeting_Widget SHALL update the displayed time every second.
3. THE Greeting_Widget SHALL display the current date showing the weekday name, month name, day number, and year.
4. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the current time and date within 1 second.

### Requirement 2: Time-of-Day Greeting

**User Story:** As a user, I want a greeting based on the time of day, so that the dashboard feels welcoming.

#### Acceptance Criteria

1. IF the current time is between 05:00 and 11:59, THEN THE Greeting_Widget SHALL display a "Good morning" greeting.
2. IF the current time is between 12:00 and 16:59, THEN THE Greeting_Widget SHALL display a "Good afternoon" greeting.
3. IF the current time is between 17:00 and 21:59, THEN THE Greeting_Widget SHALL display a "Good evening" greeting.
4. IF the current time is between 22:00 and 23:59 or between 00:00 and 04:59, THEN THE Greeting_Widget SHALL display a "Good night" greeting.
5. WHEN the Dashboard loads, THE Greeting_Widget SHALL display the greeting corresponding to the current time of day within 1 second.
6. WHEN the current time enters a different greeting time range, THE Greeting_Widget SHALL update the displayed greeting to match the new range within 1 second.

### Requirement 3: Focus Timer Countdown

**User Story:** As a user, I want a focus timer, so that I can use the Pomodoro technique to stay focused.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Focus_Timer SHALL display a default Pomodoro_Duration of 25 minutes.
2. WHEN the start button is clicked and the countdown is not paused, THE Focus_Timer SHALL begin counting down from the current Pomodoro_Duration.
3. WHEN the stop button is clicked, THE Focus_Timer SHALL pause the countdown and retain the remaining time.
4. WHEN the reset button is clicked, THE Focus_Timer SHALL stop the countdown and reset the displayed time to the current Pomodoro_Duration.
5. WHEN the countdown reaches zero, THE Focus_Timer SHALL stop counting and display zero remaining time.
6. WHEN the start button is clicked and the countdown is paused, THE Focus_Timer SHALL resume counting down from the retained remaining time.
7. WHILE the countdown is counting down, THE Focus_Timer SHALL update the displayed remaining time every second, decrementing it by one second on each update until it reaches zero.

### Requirement 4: Configurable Pomodoro Duration

**User Story:** As a user, I want to change the Pomodoro timer duration, so that I can customize my focus sessions.

#### Acceptance Criteria

1. WHEN a user sets a new Pomodoro_Duration, THE Focus_Timer SHALL accept a whole-minute duration value between 1 and 120 minutes, inclusive.
2. IF a user sets a Pomodoro_Duration outside the range of 1 to 120 minutes, THEN THE Focus_Timer SHALL reject the value, display an indication that the value was rejected, and retain the previous duration.
3. WHEN a new Pomodoro_Duration is set, THE Focus_Timer SHALL save the duration to Local_Storage.
4. WHEN the Dashboard loads, THE Focus_Timer SHALL load the saved Pomodoro_Duration from Local_Storage.
5. IF no saved Pomodoro_Duration exists in Local_Storage when the Dashboard loads, THEN THE Focus_Timer SHALL use the default Pomodoro_Duration of 25 minutes.

### Requirement 5: Add Tasks

**User Story:** As a user, I want to add tasks, so that I can track things I need to do.

#### Acceptance Criteria

1. WHEN a user submits a new Task with text containing at least one non-whitespace character and no more than 200 characters, THE Task_List SHALL add the Task to the list with an incomplete completion status and a creation order reflecting the order of addition.
2. IF a user submits a Task with text that is empty, contains only whitespace, or exceeds 200 characters, THEN THE Task_List SHALL not add the Task.
3. WHEN a new Task is added, THE Task_List SHALL save the updated task list to Local_Storage.

### Requirement 6: Edit Tasks

**User Story:** As a user, I want to edit tasks, so that I can correct or update task descriptions.

#### Acceptance Criteria

1. WHEN a user selects the edit action on a Task, THE Task_List SHALL make the Task text editable.
2. WHEN a user saves edited Task text containing at least one non-whitespace character, THE Task_List SHALL update the Task text while preserving the Task's completion status and creation order, save the updated task list to Local_Storage, and make the Task text no longer editable.
3. IF a user saves an edited Task with text that is empty or contains only whitespace, THEN THE Task_List SHALL retain the original Task text and make the Task text no longer editable.
4. IF a user cancels an edit without saving, THEN THE Task_List SHALL retain the original Task text and make the Task text no longer editable.

### Requirement 7: Mark Tasks as Done

**User Story:** As a user, I want to mark tasks as done, so that I can track completed work.

#### Acceptance Criteria

1. WHEN a user toggles the completion status of a Task, THE Task_List SHALL update the Task's completion state and save the updated task list to Local_Storage.
2. WHEN a Task is marked as done, THE Task_List SHALL apply a visual style to the Task that distinguishes the completed Task from incomplete Tasks.
3. WHEN a completed Task is toggled to not done, THE Task_List SHALL remove the completed visual style from the Task.

### Requirement 8: Delete Tasks

**User Story:** As a user, I want to delete tasks, so that I can remove items I no longer need.

#### Acceptance Criteria

1. WHEN a user selects the delete action on a Task, THE Task_List SHALL remove the Task from the displayed list.
2. WHEN a Task is removed from the displayed list, THE Task_List SHALL save the updated task list to Local_Storage.
3. IF saving the updated task list to Local_Storage fails after a Task is removed from the displayed list, THEN THE Task_List SHALL restore the removed Task to the displayed list and indicate to the user that the deletion could not be saved.

### Requirement 9: Sort Tasks

**User Story:** As a user, I want to sort tasks, so that I can organize my list.

#### Acceptance Criteria

1. WHEN a user selects a sort option, THE Task_List SHALL reorder the displayed tasks according to the selected sort criteria.
2. WHEN a user selects sorting by completion status, THE Task_List SHALL display incomplete Tasks before complete Tasks.
3. WHEN a user selects sorting by creation order, THE Task_List SHALL display Tasks ordered from oldest to newest.
4. WHILE the Task_List is sorted by completion status, THE Task_List SHALL order Tasks of equal completion status by creation order from oldest to newest.

### Requirement 10: Task List Persistence

**User Story:** As a user, I want my tasks saved, so that I do not lose them when I close the browser.

#### Acceptance Criteria

1. WHEN the Dashboard loads, THE Task_List SHALL load saved tasks from Local_Storage.
2. WHEN a task list is saved to Local_Storage and subsequently loaded, THE Task_List SHALL produce a task list with matching Task text, completion status, and creation order.
3. THE Task_List SHALL preserve Task text and completion status across browser sessions.
4. WHEN a Task is added, modified, or removed, THE Task_List SHALL save the updated task list to Local_Storage.
5. IF Local_Storage is unavailable or the save operation fails, THEN THE Task_List SHALL retain the currently displayed task list and indicate to the user that the save did not complete.
6. WHEN the Dashboard loads with no saved tasks in Local_Storage, THE Task_List SHALL display an empty task list.

### Requirement 11: Quick Links Display and Open

**User Story:** As a user, I want buttons that open favorite websites, so that I can quickly access my most-used sites.

#### Acceptance Criteria

1. WHEN a user clicks a Quick_Links button, THE Dashboard SHALL open the linked website in a new browser tab.
2. WHEN the Dashboard loads, THE Quick_Links SHALL load saved links from Local_Storage.
3. WHEN the Dashboard loads, THE Quick_Links SHALL display a button for each saved link showing the link label.

### Requirement 12: Manage Quick Links

**User Story:** As a user, I want to manage my quick links, so that I can customize my favorite websites.

#### Acceptance Criteria

1. WHEN a user adds a new link with a label between 1 and 50 characters and a URL that uses the http or https scheme followed by a domain name, THE Quick_Links SHALL add the link and save the links to Local_Storage.
2. IF a user adds a link with a URL that does not use the http or https scheme or does not contain a domain name, THEN THE Quick_Links SHALL reject the link, not save it, and display an error indication to the user that the URL is invalid.
3. WHEN a user deletes a Quick_Links entry, THE Quick_Links SHALL remove the link and save the updated links to Local_Storage.

### Requirement 13: Light and Dark Theme Toggle

**User Story:** As a user, I want a light/dark mode toggle, so that I can use the dashboard comfortably in any lighting.

#### Acceptance Criteria

1. WHEN a user toggles the theme, THE Theme_Toggle SHALL switch the Dashboard to the opposite visual mode between light and dark and visually reflect the currently active mode.
2. WHEN the theme changes, THE Theme_Toggle SHALL save the selected theme to Local_Storage.
3. WHEN the Dashboard loads, THE Theme_Toggle SHALL load and apply the saved theme from Local_Storage.
4. IF no saved theme exists in Local_Storage when the Dashboard loads, THEN THE Theme_Toggle SHALL apply a default light theme.

### Requirement 14: Client-Side Data Storage

**User Story:** As a developer, I want all data stored client-side, so that no backend server is required.

#### Acceptance Criteria

1. THE Dashboard SHALL use Local_Storage for all data persistence.
2. THE Dashboard SHALL store tasks, quick links, Pomodoro_Duration, and theme preference in Local_Storage.
3. IF a Local_Storage write operation fails, THEN THE Dashboard SHALL keep the current data available and display an error message indicating that the data was not saved.

### Requirement 15: Technology Stack

**User Story:** As a developer, I want a specific technology stack, so that the application is simple and framework-free.

#### Acceptance Criteria

1. THE Dashboard SHALL be built using only HTML, CSS, and vanilla JavaScript, with no external JavaScript frameworks or libraries.
2. THE Dashboard SHALL run entirely within the browser on the client side, requiring no backend server and no server-side processing for any functionality.

### Requirement 16: Folder Structure

**User Story:** As a developer, I want a clean folder structure, so that the code is maintainable and readable.

#### Acceptance Criteria

1. THE Dashboard SHALL contain exactly one CSS file, located inside a css/ directory at the project root.
2. THE Dashboard SHALL contain exactly one JavaScript file, located inside a js/ directory at the project root.
3. THE Dashboard SHALL contain exactly one HTML file, located at the project root.

### Requirement 17: Browser Compatibility

**User Story:** As a user, I want the dashboard to work in my browser, so that I can use it regardless of my browser choice.

#### Acceptance Criteria

1. THE Dashboard SHALL render the Greeting_Widget, Focus_Timer, Task_List, Quick_Links, and Theme_Toggle and perform all user-facing operations defined for those widgets without unhandled JavaScript errors in the two most recent major stable releases of Chrome, Firefox, Edge, and Safari.

### Requirement 18: Interface Performance

**User Story:** As a user, I want a responsive interface, so that I do not experience lag while using the dashboard.

#### Acceptance Criteria

1. WHEN a user interacts with any Dashboard control, THE Dashboard SHALL update the display within 100 milliseconds of the user interaction.
2. WHEN the Dashboard is opened, THE Dashboard SHALL display all widgets within 2 seconds from the start of the page load.
