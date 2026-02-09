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
      background-color: #eef9ef;
    }
    .calendar-day {
      border: 1px solid #dee2e6;
      border-left: .12rem solid #dee2e6;
      border-radius: .5rem;
      padding: .75rem 1rem;
      background-color: #fff;
      display: grid;
      grid-template-columns: 52px 1fr auto auto minmax(150px, 240px);
      align-items: center;
      gap: .75rem;
    }
    .calendar-day.is-sunday {
      background-color: #f5f5f5;
    }
    .calendar-day.is-off {
      background-color: #9adbb3;
    }
    .calendar-day.is-week-start {
      border-left: .32rem solid #0d6efd;
    }
    .calendar-day.is-today {
      border-color: #0d6efd;
      box-shadow: 0 0 0 .15rem rgba(13, 110, 253, .2);
    }
    .calendar-day.is-current-week {
      border-left-color: #20c997;
      box-shadow: inset 0 0 0 .08rem rgba(32, 201, 151, .35);
    }
    .calendar-list {
      display: flex;
      flex-direction: column;
      gap: .75rem;
    }
    .week-group {
      border: 1px solid #dee2e6;
      border-radius: .6rem;
      background-color: #f8f9fa;
      padding: .5rem;
    }
    .week-toggle {
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      padding: .3rem .35rem .5rem;
      font-weight: 600;
      color: #495057;
    }
    .week-toggle:hover {
      color: #212529;
    }
    .week-rows {
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .week-group.is-collapsed .week-rows {
      display: none;
    }
    .day-number {
      font-weight: 700;
    }
    .day-number .today-chip {
      display: inline-block;
      margin-left: .35rem;
      font-size: .68rem;
      font-weight: 700;
      letter-spacing: .02em;
      text-transform: uppercase;
      color: #0d6efd;
      background: rgba(13, 110, 253, .12);
      border-radius: 999px;
      padding: .1rem .4rem;
      vertical-align: middle;
    }
    .status-options {
      display: flex;
      flex-wrap: wrap;
      gap: .4rem;
      justify-content: flex-end;
    }
    .status-option {
      border: 1px solid #dee2e6;
      border-radius: 999px;
      padding: .3rem .75rem;
      font-size: .85rem;
      font-weight: 600;
      color: #212529;
      background-color: #fff;
      opacity: 1;
      transition: all .15s ease;
    }
    .status-option:hover {
      border-color: #adb5bd;
    }
    .status-option.is-selected {
      opacity: 1;
      border-color: #212529;
      box-shadow: 0 0 0 .1rem rgba(33, 37, 41, 0.1);
    }
    .status-option.is-selected.status-full {
      background-color: #ffe8b6;
    }
    .status-option.is-selected.status-half {
      background-color: #fff2c7;
    }
    .status-option.is-selected.status-off {
      background-color: #9adbb3;
    }
    .andreas-heart-toggle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2.2rem;
      height: 2.2rem;
      border: 2px solid #dc3545;
      border-radius: 999px;
      cursor: pointer;
      user-select: none;
      transition: all .15s ease;
      color: #dc3545;
      font-size: 1.35rem;
      line-height: 1;
    }
    .form-check-input:focus + .andreas-heart-toggle {
      box-shadow: 0 0 0 .15rem rgba(220, 53, 69, .2);
    }
    .andreas-heart {
      transform: translateY(-.01rem);
    }
    .andreas-heart-check {
      display: none;
      font-size: .75rem;
      margin-left: .2rem;
      font-weight: 700;
      transform: translateY(.01rem);
    }
    .form-check-input:checked + .andreas-heart-toggle {
      background-color: #dc3545;
      color: #fff;
    }
    .form-check-input:checked + .andreas-heart-toggle .andreas-heart-check {
      display: inline;
    }
    .form-check-input:not(:checked) + .andreas-heart-toggle .andreas-heart-check {
      display: none;
    }
    .form-check {
      justify-self: end;
    }
    .notes-control {
      min-width: 150px;
    }
    .notes-toggle {
      width: 100%;
    }
    .notes-input {
      resize: vertical;
      min-height: 70px;
    }
    @media (max-width: 992px) {
      .calendar-day {
        grid-template-columns: 52px 1fr;
      }
      .status-options,
      .form-check,
      .notes-control {
        grid-column: 1 / -1;
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
        <input type="month" id="monthPicker" class="form-control" value="<?= htmlspecialchars($initialMonth, ENT_QUOTES, 'UTF-8'); ?>">
      </div>
    </div>

    <div id="feedback" class="alert d-none" role="alert"></div>

    <div class="card shadow-sm">
      <div class="card-body">
        <div class="calendar-list" id="calendarGrid"></div>
      </div>
    </div>
  </div>

  <script src="assets/js/app.js?v=<?= urlencode((string) filemtime(__DIR__ . '/assets/js/app.js')); ?>"></script>
</body>
</html>
