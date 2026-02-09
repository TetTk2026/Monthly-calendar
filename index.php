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
    .calendar-day {
      border: 1px solid #dee2e6;
      border-radius: .5rem;
      padding: .75rem 1rem;
      background-color: #fff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: .75rem;
    }
    .calendar-list {
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }
    .day-number {
      font-weight: 700;
    }
    .status-button {
      min-width: 130px;
    }
  </style>
</head>
<body class="bg-light">
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

  <script src="assets/js/app.js"></script>
</body>
</html>
