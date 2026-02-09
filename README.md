# Monthly Work Schedule Planner

Monthly Work Schedule Planner is a lightweight PHP + JavaScript web app for planning daily work status across a selected month.
It is designed for quick updates, clear weekly grouping, and automatic persistence without a database.

## What the app does
- Lets you select any month and instantly load its calendar.
- Displays days grouped by week for easier month navigation.
- Supports day-level planning with simple status controls.
- Saves all changes automatically to a JSON file on the server.

## Features
- **Month navigation**
  - Month picker input.
  - Previous/next month buttons.
- **Daily status tracking**
  - Mark days as:
    - Full day
    - Half day
    - Day off
  - Sundays are visually marked and automatically treated as day off.
- **Andreas toggle per day**
  - Independent checkbox for each date.
- **Notes per day**
  - Expand/collapse notes area with Show/Hide toggle.
  - Notes are saved with a short debounce while typing.
- **Visual helpers**
  - Highlights for today and the current week.
  - Day labels and compact card-style layout.
- **Persistence**
  - Uses `data/schedule.json` as storage.
  - File is created automatically when needed.

## Tech stack
- PHP (backend API + static serving)
- Vanilla JavaScript (UI rendering and interactions)
- JSON file storage (no external database)

## Project structure
- `index.php` – main page shell and UI markup.
- `assets/js/app.js` – calendar rendering, interactions, autosave logic.
- `api.php` – month data read/write API.
- `data/schedule.json` – persisted schedule data.

## Run locally
```bash
php -S 0.0.0.0:8000
```
Then open `http://localhost:8000` in your browser.

## Usage notes
- Changing month loads that month's saved entries.
- Status/checkbox changes are saved immediately.
- Notes are saved shortly after typing stops.
