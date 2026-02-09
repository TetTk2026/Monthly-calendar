const monthPicker = document.getElementById('monthPicker');
const prevMonthButton = document.getElementById('prevMonth');
const nextMonthButton = document.getElementById('nextMonth');
const calendarGrid = document.getElementById('calendarGrid');
const feedback = document.getElementById('feedback');
const monthOverview = document.getElementById('monthOverview');
const monthEmptyHint = document.getElementById('monthEmptyHint');

const statuses = [
  { value: 'off', label: 'Off', className: 'status-off' },
  { value: 'full', label: 'Full', className: 'status-full' },
  { value: 'half', label: 'Half', className: 'status-half' }
];

const statusCycleOrder = statuses.map((status) => status.value);
const statusLabelByValue = statuses.reduce((accumulator, status) => {
  accumulator[status.value] = status.label;
  return accumulator;
}, {});

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


function formatCount(value, singularLabel, pluralLabel) {
  return `${value} ${value === 1 ? singularLabel : pluralLabel}`;
}

function buildSummaryText(counts) {
  return `${formatCount(counts.full, 'full day', 'full days')} · ${formatCount(counts.half, 'half', 'halves')} · ${counts.off} off`;
}

function getWeekPoeticHint(counts) {
  const total = counts.full + counts.half + counts.off;
  if (total === 0) {
    return 'A quiet week. Anything planned?';
  }
  if (counts.full >= 5) {
    return 'A steady rhythm carries this week.';
  }
  if (counts.off >= 2) {
    return 'Room to breathe between the days.';
  }
  return 'A gentle balance across the week.';
}

function getMonthPoeticHint(monthCounts) {
  const totalPlanned = monthCounts.full + monthCounts.half + monthCounts.off;
  if (totalPlanned === 0 && monthCounts.hearts === 0) {
    return 'This month is still a blank page.';
  }

  if (monthCounts.hearts >= 8 && monthCounts.weekendDays >= 8) {
    return 'Cupid filed your month under: premium romance package.';
  }

  if (monthCounts.hearts >= 6 && monthCounts.weekendDays >= 8) {
    return 'Long weekend with your sweetheart? This is basically a rom-com calendar.';
  }

  if (monthCounts.hearts >= 5 && monthCounts.weekendDays >= 6) {
    return 'Long weekends with your sweetheart: dangerously cute levels detected.';
  }

  if (monthCounts.hearts >= 3) {
    return 'Heart count is rising. Your calendar is flirting back.';
  }

  if (monthCounts.weekendDays >= 6) {
    return 'Weekend mode unlocked: naps, snacks, and sweetheart attacks.';
  }

  if (monthCounts.hearts >= 1 && monthCounts.weekendDays >= 2) {
    return 'Weekend + heart combo achieved. Certified cute schedule.';
  }

  return '';
}

function updateMonthOverview(monthCounts) {
  monthOverview.innerHTML = '';
  const items = [
    { label: 'full days', value: monthCounts.full },
    { label: 'half days', value: monthCounts.half },
    { label: 'days off', value: monthCounts.off },
    { label: 'sweetheart days ♥', value: monthCounts.hearts },
    { label: 'weekend days', value: monthCounts.weekendDays }
  ];

  items.forEach((item) => {
    const pill = document.createElement('span');
    pill.className = 'month-overview-pill';
    pill.textContent = `${item.value} ${item.label}`;
    monthOverview.appendChild(pill);
  });

  const hint = getMonthPoeticHint(monthCounts);
  monthEmptyHint.textContent = hint;
  monthEmptyHint.classList.toggle('d-none', !hint);
}

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

function getIsoWeekNumber(date) {
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() + 3 - ((target.getDay() + 6) % 7));
  const week1 = new Date(target.getFullYear(), 0, 4);
  return 1 + Math.round(((target.getTime() - week1.getTime()) / 86400000
    - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

function createWeekKey(date) {
  const weekStart = getWeekStart(date);
  return formatDate(weekStart);
}

function isPastWeek(weekStartDate) {
  const currentWeekStart = getWeekStart(new Date());
  return weekStartDate.getTime() < currentWeekStart.getTime();
}

function createWeekSection(weekStartDate, summaryText, poeticHint, hasEntries) {
  const section = document.createElement('section');
  section.className = 'week-group';
  const weekKey = formatDate(weekStartDate);
  const isPast = isPastWeek(weekStartDate);
  const weekNumber = getIsoWeekNumber(weekStartDate);

  section.classList.toggle('is-past-week', isPast);

  const weekHeader = document.createElement('div');
  weekHeader.className = 'week-header';

  const weekLabel = document.createElement('button');
  weekLabel.type = 'button';
  weekLabel.className = 'week-toggle';

  const weekToggleIcon = document.createElement('span');
  weekToggleIcon.className = 'week-toggle-icon';

  weekLabel.appendChild(weekToggleIcon);

  const weekMeta = document.createElement('div');
  weekMeta.className = 'week-meta';
  weekMeta.textContent = `W${String(weekNumber).padStart(2, '0')} · ${weekStartDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  })}`;

  const weekSummaryInline = document.createElement('div');
  weekSummaryInline.className = 'week-summary-inline';
  weekSummaryInline.textContent = summaryText;

  const weekSummary = document.createElement('div');
  weekSummary.className = 'week-summary';
  weekSummary.classList.toggle('is-empty', !hasEntries);

  const weekSummaryText = document.createElement('div');
  weekSummaryText.textContent = summaryText;

  const weekSummaryPoem = document.createElement('div');
  weekSummaryPoem.className = 'week-summary-poem';
  weekSummaryPoem.textContent = poeticHint;
  weekSummaryPoem.classList.toggle('d-none', !hasEntries);

  weekSummary.appendChild(weekSummaryText);
  weekSummary.appendChild(weekSummaryPoem);

  const weekRows = document.createElement('div');
  weekRows.className = 'week-rows';

  const collapsedByDefault = weekCollapsedByKey[weekKey] !== undefined
    ? Boolean(weekCollapsedByKey[weekKey])
    : isPast;
  section.classList.toggle('is-collapsed', collapsedByDefault);

  const syncLabel = () => {
    const collapsed = section.classList.contains('is-collapsed');
    weekLabel.setAttribute('aria-expanded', String(!collapsed));
    weekLabel.setAttribute('aria-label', `${collapsed ? 'Expand' : 'Collapse'} week of ${weekStartDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    })}`);
    weekToggleIcon.textContent = collapsed ? '▸' : '▾';
  };

  weekLabel.addEventListener('click', () => {
    section.classList.toggle('is-collapsed');
    weekCollapsedByKey[weekKey] = section.classList.contains('is-collapsed');
    persistMap(WEEK_COLLAPSE_STORAGE_KEY, weekCollapsedByKey);
    syncLabel();
  });

  syncLabel();
  weekHeader.appendChild(weekLabel);
  weekHeader.appendChild(weekMeta);
  weekHeader.appendChild(weekSummaryInline);
  section.appendChild(weekHeader);
  section.appendChild(weekSummary);
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

function getNextStatus(currentStatus) {
  const currentIndex = statusCycleOrder.indexOf(currentStatus);
  if (currentIndex === -1) {
    return statusCycleOrder[0];
  }

  return statusCycleOrder[(currentIndex + 1) % statusCycleOrder.length];
}

function updateStatusHero(hero, status) {
  hero.classList.remove('status-full', 'status-half', 'status-off');

  if (status) {
    hero.classList.add(`status-${status}`);
  }

  const iconByStatus = {
    full: '●',
    half: '◐',
    off: '○'
  };
  const label = hero.querySelector('.status-hero-label');
  label.innerHTML = '';
  const shape = document.createElement('span');
  shape.className = 'status-shape';
  shape.textContent = iconByStatus[status] || '◌';

  const text = document.createElement('span');
  text.textContent = statusLabelByValue[status] || 'Set day status';
  label.appendChild(shape);
  label.appendChild(text);
}

async function cycleDayStatus(dateString, row, statusHero) {
  const currentStatus = row.dataset.status || '';
  const nextStatus = getNextStatus(currentStatus);

  try {
    await saveDayStatus(dateString, nextStatus);
    row.dataset.status = nextStatus;
    applyRowStatusClass(row, nextStatus);
    updateStatusHero(statusHero, nextStatus);
    statusHero.classList.remove('status-morph');
    void statusHero.offsetWidth;
    statusHero.classList.add('status-morph');
    renderCalendar(monthPicker.value);
    showFeedback('Saved');
  } catch (error) {
    showFeedback('Could not save entry', 'danger');
  }
}

function createStatusHero(currentValue) {
  const hero = document.createElement('div');
  hero.className = 'status-hero';

  const label = document.createElement('div');
  label.className = 'status-hero-label';

  const hint = document.createElement('div');
  hint.className = 'status-hero-hint';
  hint.textContent = 'CLICK DAY CARD TO CYCLE';

  hero.appendChild(label);
  hero.appendChild(hint);
  updateStatusHero(hero, currentValue);

  return hero;
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
    label.classList.remove('heart-pop');
    void label.offsetWidth;
    label.classList.add('heart-pop');
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
  toggleButton.setAttribute('aria-label', 'Toggle notes');

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

  const setToggleMeta = () => {
    const hasValue = notesInput.value.trim().length > 0;
    const preview = hasValue ? notesInput.value.trim().slice(0, 70) : 'No note yet';
    toggleButton.classList.toggle('has-note', hasValue);
    toggleButton.title = preview;
  };

  const applyExpandedState = () => {
    const expanded = Boolean(notesExpandedByDate[dateString]);
    notesInput.classList.toggle('is-collapsed', !expanded);
    toggleButton.textContent = '📝';
    toggleButton.setAttribute('aria-expanded', String(expanded));
  };

  toggleButton.addEventListener('click', () => {
    notesExpandedByDate[dateString] = !notesExpandedByDate[dateString];
    persistMap(NOTES_VISIBILITY_STORAGE_KEY, notesExpandedByDate);
    applyExpandedState();
  });

  notesInput.addEventListener('blur', async () => {
    const previous = (monthEntries[dateString] && monthEntries[dateString].notes) || '';
    try {
      await saveNotes(dateString, notesInput.value.trim());
      setToggleMeta();
      showFeedback('Saved');
    } catch (error) {
      notesInput.value = previous;
      setToggleMeta();
      showFeedback('Could not save notes', 'danger');
    }
  });

  notesInput.addEventListener('input', setToggleMeta);
  setToggleMeta();
  applyExpandedState();
  wrapper.appendChild(toggleButton);
  wrapper.appendChild(notesInput);
  return wrapper;
}

function createSundayOffLabel() {
  const label = document.createElement('div');
  label.className = 'status-hero status-off';
  label.innerHTML = '<div class="status-hero-label">Off</div><div class="status-hero-hint">Sunday</div>';
  return label;
}

function renderCalendar(monthString) {
  calendarGrid.innerHTML = '';

  const [year, month] = monthString.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const { weekStart, weekEnd } = getHighlightedWeekRange();

  const weeks = new Map();
  const weekStats = new Map();
  const monthCounts = { full: 0, half: 0, off: 0, hearts: 0, weekendDays: 0 };

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month - 1, day);
    const dateString = formatDate(cellDate);
    const weekKey = createWeekKey(cellDate);
    const entry = monthEntries[dateString] || { status: '', andreas: false, notes: '' };
    const currentStatus = entry.status || '';
    const weekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;

    if (entry.andreas) {
      monthCounts.hearts += 1;
    }
    if (weekend) {
      monthCounts.weekendDays += 1;
    }

    if (!weekStats.has(weekKey)) {
      weekStats.set(weekKey, { full: 0, half: 0, off: 0 });
    }

    if (currentStatus) {
      weekStats.get(weekKey)[currentStatus] += 1;
      monthCounts[currentStatus] += 1;
    }
  }

  updateMonthOverview(monthCounts);

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month - 1, day);
    const dateString = formatDate(cellDate);
    const weekKey = createWeekKey(cellDate);

    if (!weeks.has(weekKey)) {
      const weekStartDate = getWeekStart(cellDate);
      const counts = weekStats.get(weekKey) || { full: 0, half: 0, off: 0 };
      const summaryText = buildSummaryText(counts);
      const hasEntries = counts.full + counts.half + counts.off > 0;
      const weekSection = createWeekSection(
        weekStartDate,
        summaryText,
        getWeekPoeticHint(counts),
        hasEntries
      );
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

    const dayMain = document.createElement('div');
    dayMain.className = 'day-main';

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
    row.dataset.status = currentStatus;
    applyRowStatusClass(row, currentStatus);
    const statusControl = sunday
      ? createSundayOffLabel()
      : createStatusHero(currentStatus);
    dayMain.appendChild(dayName);
    dayMain.appendChild(dateLabel);

    const andreasCheckbox = createAndreasCheckbox(dateString, entry.andreas || false);
    const notesControl = createNotesControl(dateString, entry.notes || '');
    const actions = document.createElement('div');
    actions.className = 'day-actions';
    actions.appendChild(andreasCheckbox);
    actions.appendChild(notesControl);

    andreasCheckbox.addEventListener('click', (event) => event.stopPropagation());
    notesControl.addEventListener('click', (event) => event.stopPropagation());

    if (!sunday) {
      row.classList.add('is-clickable-status');
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', `Cycle status for ${dateString}`);
      row.addEventListener('click', () => {
        cycleDayStatus(dateString, row, statusControl);
      });
      row.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          cycleDayStatus(dateString, row, statusControl);
        }
      });
    }

    row.appendChild(dayMain);
    row.appendChild(statusControl);
    row.appendChild(actions);
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
