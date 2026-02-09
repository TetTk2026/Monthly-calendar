const monthPicker = document.getElementById('monthPicker');
const calendarGrid = document.getElementById('calendarGrid');
const feedback = document.getElementById('feedback');

const statuses = [
  { value: 'full', label: 'Full day', buttonClass: 'status-full' },
  { value: 'half', label: 'Half day', buttonClass: 'status-half' },
  { value: 'off', label: 'Day off', buttonClass: 'status-off' }
];

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let monthEntries = {};

function isSunday(date) {
  return date.getDay() === 0;
}

function showFeedback(message, type = 'success') {
  feedback.className = `alert alert-${type}`;
  feedback.textContent = message;
  feedback.classList.remove('d-none');
  setTimeout(() => feedback.classList.add('d-none'), 1800);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isToday(date) {
  const now = new Date();
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function getHighlightedWeekRange() {
  const referenceDate = new Date();

  if (referenceDate.getDay() === 0) {
    referenceDate.setDate(referenceDate.getDate() + 1);
  }

  const dayOfWeek = referenceDate.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekStart = new Date(referenceDate);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(referenceDate.getDate() + diffToMonday);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return { weekStart, weekEnd };
}

function isInHighlightedWeek(date, weekStart, weekEnd) {
  return date >= weekStart && date <= weekEnd;
}

async function saveDayStatus(dateString, value) {
  const response = await fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: dateString, status: value })
  });

  if (!response.ok) {
    throw new Error('Failed to save entry');
  }

  const current = monthEntries[dateString] || { status: 'off', andreas: false };
  current.status = value;

  if (current.status === '' && !current.andreas) {
    delete monthEntries[dateString];
    return;
  }

  monthEntries[dateString] = current;
}

async function saveAndreas(dateString, value) {
  const response = await fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: dateString, andreas: value })
  });

  if (!response.ok) {
    throw new Error('Failed to save Andreas entry');
  }

  const current = monthEntries[dateString] || { status: 'off', andreas: false };
  current.andreas = value;

  if (current.status === '' && !current.andreas) {
    delete monthEntries[dateString];
    return;
  }

  monthEntries[dateString] = current;
}

function applyRowStatusClass(row, status) {
  row.classList.toggle('is-off', status === 'off');
  row.classList.toggle('is-full', status === 'full');
  row.classList.toggle('is-half', status === 'half');
}

function createStatusButtons(dateString, currentValue, row) {
  const wrapper = document.createElement('div');
  wrapper.className = 'status-options';

  statuses.forEach((status) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `status-option ${status.buttonClass}`;
    button.textContent = status.label;

    if (status.value === currentValue) {
      button.classList.add('is-selected');
    }

    button.addEventListener('click', async () => {
      try {
        await saveDayStatus(dateString, status.value);
        wrapper.querySelectorAll('.status-option').forEach((element) => element.classList.remove('is-selected'));
        button.classList.add('is-selected');
        applyRowStatusClass(row, status.value);
        showFeedback('Saved');
      } catch (error) {
        showFeedback('Could not save entry', 'danger');
      }
    });

    wrapper.appendChild(button);
  });

  return wrapper;
}

function createAndreasCheckbox(dateString, currentValue) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-check m-0';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'form-check-input';
  checkbox.id = `andreas-${dateString}`;
  checkbox.checked = Boolean(currentValue);

  const label = document.createElement('label');
  label.className = 'form-check-label small';
  label.setAttribute('for', checkbox.id);
  label.textContent = 'Andreas ';

  const heart = document.createElement('span');
  heart.className = 'andreas-heart';
  heart.textContent = '♥';
  label.appendChild(heart);

  checkbox.addEventListener('change', async () => {
    try {
      await saveAndreas(dateString, checkbox.checked);
      showFeedback('Saved');
    } catch (error) {
      checkbox.checked = !checkbox.checked;
      showFeedback('Could not save entry', 'danger');
    }
  });

  wrapper.appendChild(checkbox);
  wrapper.appendChild(label);
  return wrapper;
}

function createSundayOffLabel() {
  const label = document.createElement('div');
  label.className = 'small text-muted fw-semibold';
  label.textContent = 'Day off (Sunday)';
  return label;
}

function renderCalendar(monthString) {
  calendarGrid.innerHTML = '';

  const [year, month] = monthString.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const { weekStart, weekEnd } = getHighlightedWeekRange();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month - 1, day);
    const dateString = formatDate(cellDate);

    const row = document.createElement('div');
    row.className = 'calendar-day';
    if (cellDate.getDay() === 0) {
      row.classList.add('is-sunday');
    }
    if (cellDate.getDay() === 1) {
      row.classList.add('is-week-start');
    }
    if (isToday(cellDate)) {
      row.classList.add('is-today');
    }
    if (isInHighlightedWeek(cellDate, weekStart, weekEnd)) {
      row.classList.add('is-current-week');
    }

    const dayName = document.createElement('div');
    dayName.className = 'day-name';
    dayName.textContent = weekdayNames[cellDate.getDay()];

    const dateLabel = document.createElement('div');
    dateLabel.className = 'day-number';
    dateLabel.textContent = String(day);
    if (isToday(cellDate)) {
      const todayChip = document.createElement('span');
      todayChip.className = 'today-chip';
      todayChip.textContent = 'Today';
      dateLabel.appendChild(todayChip);
    }

    const entry = monthEntries[dateString] || { status: 'off', andreas: false };
    const sunday = isSunday(cellDate);
    const currentStatus = entry.status || 'off';
    applyRowStatusClass(row, currentStatus);
    const statusControl = sunday
      ? createSundayOffLabel()
      : createStatusButtons(dateString, currentStatus, row);
    const andreasCheckbox = createAndreasCheckbox(dateString, entry.andreas || false);

    row.appendChild(dayName);
    row.appendChild(dateLabel);
    row.appendChild(statusControl);
    row.appendChild(andreasCheckbox);
    calendarGrid.appendChild(row);
  }
}

async function loadMonth(monthString) {
  try {
    const response = await fetch(`api.php?month=${monthString}`);
    if (!response.ok) throw new Error('Failed to load month data');
    const payload = await response.json();
    monthEntries = payload.entries || {};
    renderCalendar(monthString);
  } catch (error) {
    showFeedback('Could not load month data', 'danger');
    monthEntries = {};
    renderCalendar(monthString);
  }
}

monthPicker.addEventListener('change', (event) => {
  loadMonth(event.target.value);
});

loadMonth(monthPicker.value);
