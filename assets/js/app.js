const monthPicker = document.getElementById('monthPicker');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const calendarGrid = document.getElementById('calendarGrid');
const feedback = document.getElementById('feedback');

const statuses = [
  { value: 'full', label: 'Full day', buttonClass: 'status-full' },
  { value: 'half', label: 'Half day', buttonClass: 'status-half' },
  { value: 'off', label: 'Day off', buttonClass: 'status-off' }
];

const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
let monthEntries = {};
const notesExpandedByDate = {};
const weekCollapsedByKey = {};

const NOTES_VISIBILITY_STORAGE_KEY = 'calendarNotesVisibility';
const WEEK_COLLAPSE_STORAGE_KEY = 'calendarWeekCollapsed';

function loadStoredMap(key) {
  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : {};
  } catch (error) {
    return {};
  }
}

function persistMap(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Ignore storage write errors.
  }
}

Object.assign(notesExpandedByDate, loadStoredMap(NOTES_VISIBILITY_STORAGE_KEY));
Object.assign(weekCollapsedByKey, loadStoredMap(WEEK_COLLAPSE_STORAGE_KEY));

function isSunday(date) {
  return date.getDay() === 0;
}

function getWeekStart(date) {
  const weekStart = new Date(date);
  weekStart.setHours(0, 0, 0, 0);
  const day = weekStart.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  weekStart.setDate(weekStart.getDate() - distanceFromMonday);
  return weekStart;
}

function createWeekKey(date) {
  const weekStart = getWeekStart(date);
  return formatDate(weekStart);
}

function isPastWeek(weekStartDate) {
  const currentWeekStart = getWeekStart(new Date());
  return weekStartDate.getTime() < currentWeekStart.getTime();
}

function createWeekSection(weekStartDate) {
  const section = document.createElement('section');
  section.className = 'week-group';
  const weekKey = formatDate(weekStartDate);

  const weekLabel = document.createElement('button');
  weekLabel.type = 'button';
  weekLabel.className = 'week-toggle';
  weekLabel.textContent = `Week of ${weekStartDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })}`;

  const weekRows = document.createElement('div');
  weekRows.className = 'week-rows';

  const collapsedByDefault = weekCollapsedByKey[weekKey] !== undefined
    ? Boolean(weekCollapsedByKey[weekKey])
    : isPastWeek(weekStartDate);
  section.classList.toggle('is-collapsed', collapsedByDefault);

  const syncLabel = () => {
    const collapsed = section.classList.contains('is-collapsed');
    weekLabel.setAttribute('aria-expanded', String(!collapsed));
    weekLabel.textContent = `${collapsed ? 'Show' : 'Hide'} week of ${weekStartDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    })}`;
  };

  weekLabel.addEventListener('click', () => {
    section.classList.toggle('is-collapsed');
    weekCollapsedByKey[weekKey] = section.classList.contains('is-collapsed');
    persistMap(WEEK_COLLAPSE_STORAGE_KEY, weekCollapsedByKey);
    syncLabel();
  });

  syncLabel();
  section.appendChild(weekLabel);
  section.appendChild(weekRows);

  return { section, weekRows };
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

  const current = monthEntries[dateString] || { status: '', andreas: false, notes: '' };
  current.status = value;

  if (current.status === '' && !current.andreas && !current.notes) {
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

  const current = monthEntries[dateString] || { status: '', andreas: false, notes: '' };
  current.andreas = value;

  if (current.status === '' && !current.andreas && !current.notes) {
    delete monthEntries[dateString];
    return;
  }

  monthEntries[dateString] = current;
}

async function saveNotes(dateString, value) {
  const response = await fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: dateString, notes: value })
  });

  if (!response.ok) {
    throw new Error('Failed to save notes');
  }

  const current = monthEntries[dateString] || { status: '', andreas: false, notes: '' };
  current.notes = value;

  if (current.status === '' && !current.andreas && !current.notes) {
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
  checkbox.className = 'form-check-input visually-hidden';
  checkbox.id = `andreas-${dateString}`;
  checkbox.checked = Boolean(currentValue);

  const label = document.createElement('label');
  label.className = 'andreas-heart-toggle';
  label.setAttribute('for', checkbox.id);
  label.setAttribute('aria-label', 'Mark heart');

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

function createNotesControl(dateString, currentValue) {
  const wrapper = document.createElement('div');
  wrapper.className = 'notes-control';

  const toggleButton = document.createElement('button');
  toggleButton.type = 'button';
  toggleButton.className = 'btn btn-sm btn-outline-secondary notes-toggle';

  const notesInput = document.createElement('textarea');
  notesInput.className = 'form-control form-control-sm notes-input mt-2';
  notesInput.rows = 3;
  notesInput.placeholder = 'Notes for this day';
  notesInput.value = currentValue || '';

  const hasNotes = Boolean(currentValue);
  if (notesExpandedByDate[dateString] === undefined) {
    notesExpandedByDate[dateString] = hasNotes;
    persistMap(NOTES_VISIBILITY_STORAGE_KEY, notesExpandedByDate);
  }

  const applyExpandedState = () => {
    const expanded = Boolean(notesExpandedByDate[dateString]);
    notesInput.classList.toggle('d-none', !expanded);
    toggleButton.textContent = expanded ? 'Hide notes' : 'Show notes';
  };

  toggleButton.addEventListener('click', () => {
    notesExpandedByDate[dateString] = !notesExpandedByDate[dateString];
    persistMap(NOTES_VISIBILITY_STORAGE_KEY, notesExpandedByDate);
    applyExpandedState();
  });

  let saveTimer;
  notesInput.addEventListener('input', () => {
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(async () => {
      const previous = (monthEntries[dateString] && monthEntries[dateString].notes) || '';
      try {
        await saveNotes(dateString, notesInput.value.trim());
        showFeedback('Saved');
      } catch (error) {
        notesInput.value = previous;
        showFeedback('Could not save notes', 'danger');
      }
    }, 350);
  });

  applyExpandedState();
  wrapper.appendChild(toggleButton);
  wrapper.appendChild(notesInput);
  return wrapper;
}

function createSundayOffLabel() {
  const label = document.createElement('div');
  label.className = 'small text-muted fw-semibold';
  label.textContent = '';
  return label;
}

function renderCalendar(monthString) {
  calendarGrid.innerHTML = '';

  const [year, month] = monthString.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const { weekStart, weekEnd } = getHighlightedWeekRange();

  const weeks = new Map();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month - 1, day);
    const dateString = formatDate(cellDate);
    const weekKey = createWeekKey(cellDate);

    if (!weeks.has(weekKey)) {
      const weekStartDate = getWeekStart(cellDate);
      const weekSection = createWeekSection(weekStartDate);
      weeks.set(weekKey, weekSection);
      calendarGrid.appendChild(weekSection.section);
    }

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

    const entry = monthEntries[dateString] || { status: '', andreas: false, notes: '' };
    const sunday = isSunday(cellDate);
    const currentStatus = sunday ? 'off' : (entry.status || '');
    applyRowStatusClass(row, currentStatus);
    const statusControl = sunday
      ? createSundayOffLabel()
      : createStatusButtons(dateString, currentStatus, row);
    const andreasCheckbox = createAndreasCheckbox(dateString, entry.andreas || false);
    const notesControl = createNotesControl(dateString, entry.notes || '');

    row.appendChild(dayName);
    row.appendChild(dateLabel);
    row.appendChild(statusControl);
    row.appendChild(andreasCheckbox);
    row.appendChild(notesControl);
    weeks.get(weekKey).weekRows.appendChild(row);
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

function shiftMonth(value, offset) {
  const [year, month] = value.split('-').map(Number);
  const shiftedDate = new Date(year, month - 1 + offset, 1);
  return `${shiftedDate.getFullYear()}-${String(shiftedDate.getMonth() + 1).padStart(2, '0')}`;
}

prevMonthButton.addEventListener('click', () => {
  monthPicker.value = shiftMonth(monthPicker.value, -1);
  loadMonth(monthPicker.value);
});

nextMonthButton.addEventListener('click', () => {
  monthPicker.value = shiftMonth(monthPicker.value, 1);
  loadMonth(monthPicker.value);
});

loadMonth(monthPicker.value);
