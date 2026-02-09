<?php
$initialMonth = date('Y-m');
?>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Work Schedule Planner</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  <style>
    body {
      background-color: white;
    }
    :root {
      --accent: #2563eb;
      --line: #dbe3ec;
      --row-bg: #ffffff;
      --row-hover: #f8fbff;
      --status-full: #e8f1ff;
      --status-half: #f1f6ff;
      --status-off: #f6f9ff;
    }
    .calendar-day {
      border: 0;
      border-radius: 0;
      padding: .35rem .6rem;
      background-color: transparent;
      display: grid;
      grid-template-columns: minmax(88px, 115px) minmax(120px, 1fr) 88px;
      align-items: center;
      gap: .45rem;
      transition: background-color .2s ease;
    }
    .calendar-day + .calendar-day {
      border-top: 1px solid var(--line);
    }
    .calendar-day:hover {
      background: var(--row-hover);
    }
    .calendar-day.is-sunday {
      background-color: #f8fbff;
    }
    .calendar-day.is-off {
      background-color: var(--status-off);
    }
    .calendar-day.is-full {
      background-color: var(--status-full);
    }
    .calendar-day.is-half {
      background-color: var(--status-half);
    }
    .calendar-day.is-sunday.is-off,
    .calendar-day.is-sunday.is-full,
    .calendar-day.is-sunday.is-half {
      background-color: #f8fbff;
    }
    .calendar-day.is-today {
      background-color: rgba(37, 99, 235, .06);
    }
    .calendar-day.is-current-week {
      background-color: rgba(37, 99, 235, .03);
    }
    .status-hero.status-morph {
      animation: statusMorph .2s ease;
    }
    @keyframes statusMorph {
      0% { filter: saturate(1); }
      50% { filter: saturate(1.08) brightness(1.02); }
      100% { filter: saturate(1); }
    }
    .calendar-list {
      display: flex;
      flex-direction: column;
      gap: .55rem;
    }
    .week-group {
      border: 1px solid var(--line);
      border-radius: .5rem;
      padding: .25rem .5rem;
      background-color: #fff;
    }
    .week-header {
      display: grid;
      grid-template-columns: auto auto minmax(180px, 1fr);
      align-items: center;
      gap: .4rem;
      padding: .05rem 0 .25rem;
    }
    .week-toggle {
      width: auto;
      text-align: left;
      display: inline-flex;
      align-items: center;
      gap: .25rem;
      border: 0;
      background: transparent;
      padding: .1rem .2rem;
      font-weight: 600;
      color: #495057;
    }
    .week-toggle-icon {
      font-size: .8rem;
      width: .7rem;
    }
    .week-toggle:hover {
      color: #212529;
    }
    .week-meta {
      font-size: .84rem;
      color: #6c757d;
      white-space: nowrap;
    }
    .week-summary-inline {
      font-size: .82rem;
      color: #6c757d;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      justify-self: end;
    }
    .week-summary {
      font-size: .86rem;
      color: #6c757d;
      padding: 0 .35rem .35rem;
    }
    .week-summary.is-empty {
      display: none;
    }
    .week-summary-poem {
      font-size: .8rem;
      color: #86929d;
      font-style: italic;
      margin-top: .12rem;
      opacity: 0;
      max-height: 0;
      overflow: hidden;
      transition: opacity .15s ease, max-height .2s ease;
    }
    .week-group:hover .week-summary-poem,
    .week-group:focus-within .week-summary-poem {
      opacity: 1;
      max-height: 1.25rem;
    }
    .week-group.is-collapsed .week-summary-poem {
      opacity: 0;
      max-height: 0;
    }
    .week-group.is-past-week {
      padding: .2rem .45rem;
    }
    .week-group.is-past-week .week-header {
      padding-bottom: .2rem;
      grid-template-columns: auto auto minmax(120px, 1fr);
      gap: .35rem;
    }
    .week-group.is-past-week .week-meta,
    .week-group.is-past-week .week-summary-inline {
      font-size: .78rem;
    }
    .week-group.is-past-week .week-summary {
      display: none;
    }
    .week-group.is-past-week .week-rows {
      gap: 0;
    }
    .month-overview-strip {
      display: flex;
      flex-wrap: wrap;
      gap: .5rem;
      border: 1px solid #dbe5df;
      border-radius: 999px;
      background: #f7fbf7;
      padding: .35rem .6rem;
      margin-bottom: .75rem;
    }
    .month-overview-pill {
      font-size: .82rem;
      color: #495057;
    }
    .month-empty-hint {
      margin: .35rem 0 .15rem;
      color: #86929d;
      font-style: italic;
      font-size: .9rem;
    }
    .week-rows {
      display: flex;
      flex-direction: column;
      gap: 0;
    }
    .week-group.is-collapsed .week-rows {
      display: none;
    }
    .day-main {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      line-height: 1.05;
    }
    .day-name {
      font-size: .82rem;
      font-weight: 600;
      color: #5c6a78;
      letter-spacing: .01em;
    }
    .day-number {
      font-size: 1.2rem;
      font-weight: 800;
      color: #1f2937;
    }
    .day-number .today-chip {
      display: inline-block;
      margin-left: .4rem;
      font-size: .62rem;
      font-weight: 600;
      letter-spacing: .02em;
      text-transform: uppercase;
      color: var(--accent);
      background: rgba(37, 99, 235, .12);
      border: 1px solid rgba(37, 99, 235, .22);
      border-radius: 999px;
      padding: .1rem .4rem;
      vertical-align: middle;
      animation: todayPulse 2s ease-in-out infinite;
    }
    @keyframes todayPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .status-hero {
      border: 0;
      border-radius: 0;
      padding: 0;
      background: transparent;
      transition: color .2s ease;
    }
    .status-hero-label {
      font-size: .95rem;
      font-weight: 650;
      line-height: 1.1;
      display: inline-flex;
      align-items: center;
      gap: .35rem;
      color: #1f2937;
    }
    .status-shape {
      font-size: .92rem;
      color: var(--accent);
      line-height: 1;
    }
    .status-hero.status-full { color: #0f3f9e; }
    .status-hero.status-half { color: #2458b8; }
    .status-hero.status-off { color: #4c6ea7; }
    .is-clickable-status {
      cursor: pointer;
    }
    .is-clickable-status:hover .status-hero,
    .is-clickable-status:focus-visible .status-hero {
      color: #0b48be;
    }
    .andreas-heart-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      height: 2rem;
      border: 2px solid #adb5bd;
      border-radius: 999px;
      cursor: pointer;
      user-select: none;
      transition: all .15s ease;
      color: #6c757d;
      font-size: 1.2rem;
      line-height: 1;
    }
    .andreas-heart-toggle.heart-pop {
      animation: heartPop .25s ease;
    }
    @keyframes heartPop {
      0% { transform: scale(1); }
      45% { transform: scale(1.18); }
      100% { transform: scale(1); }
    }
    .form-check-input:focus + .andreas-heart-toggle {
      box-shadow: 0 0 0 .15rem rgba(220, 53, 69, .2);
    }
    .andreas-heart {
      transform: translateY(-.01rem);
    }
    .form-check-input:checked + .andreas-heart-toggle {
      background-color: #dc3545;
      border-color: #dc3545;
      color: #fff;
    }
    .month-nav-btn {
      width: 2.25rem;
      height: 2.25rem;
      padding: 0;
      font-size: 1.15rem;
      line-height: 1;
    }
    .day-actions {
      justify-self: end;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: .35rem;
      width: 88px;
    }
    .notes-control {
      min-width: 40px;
      display: flex;
      justify-content: flex-end;
    }
    .notes-toggle {
      width: 2rem;
      height: 2rem;
      padding: 0;
      border-radius: 999px;
      position: relative;
      transition: transform .2s ease, box-shadow .2s ease, background-color .2s ease;
    }
    .notes-toggle:hover,
    .notes-toggle:focus-visible {
      transform: translateY(-1px);
      box-shadow: 0 0 0 .15rem rgba(13, 110, 253, .15);
    }
    .notes-toggle.has-note::after {
      content: '';
      position: absolute;
      top: .24rem;
      right: .24rem;
      width: .4rem;
      height: .4rem;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 .08rem #fff;
    }
    .notes-input {
      resize: vertical;
      min-height: 64px;
      opacity: 1;
      max-height: 210px;
      overflow: hidden;
      transform-origin: top;
      transform: translateY(0);
      transition: max-height .28s ease, opacity .25s ease, margin-top .28s ease, transform .25s ease;
    }
    .notes-input.is-collapsed {
      opacity: 0;
      max-height: 0;
      margin-top: 0 !important;
      transform: translateY(-6px);
      pointer-events: none;
      padding-top: 0;
      padding-bottom: 0;
      border-width: 0;
    }
    @media (max-width: 992px) {
      .calendar-day {
        grid-template-columns: 1fr auto;
      }
      .week-header {
        grid-template-columns: auto 1fr;
      }
      .week-summary-inline {
        grid-column: 1 / -1;
        justify-self: start;
      }
      .status-hero,
      .notes-control {
        grid-column: 1 / -1;
      }
      .day-actions {
        grid-column: 2;
      }
    }
  </style>
</head>
<body>
  <div class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
      <h1 class="h3 mb-0">Work Schedule Planner</h1>
      <div class="d-flex align-items-center gap-2">
        <label for="monthPicker" class="form-label mb-0">Month:</label>
        <button type="button" id="prevMonth" class="btn btn-outline-secondary month-nav-btn" aria-label="Previous month">‹</button>
        <input type="month" id="monthPicker" class="form-control" value="<?= htmlspecialchars($initialMonth, ENT_QUOTES, 'UTF-8'); ?>">
        <button type="button" id="nextMonth" class="btn btn-outline-secondary month-nav-btn" aria-label="Next month">›</button>
      </div>
    </div>

    <div id="feedback" class="alert d-none" role="alert"></div>

    <div id="monthOverview" class="month-overview-strip"></div>
    <div id="monthEmptyHint" class="month-empty-hint d-none"></div>
    <div class="calendar-list" id="calendarGrid"></div>
  </div>

  <script src="assets/js/app.js?v=<?= urlencode((string) filemtime(__DIR__ . '/assets/js/app.js')); ?>"></script>
</body>
</html>
