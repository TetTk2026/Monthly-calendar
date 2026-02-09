const monthPicker = document.getElementById('monthPicker');
const calendarGrid = document.getElementById('calendarGrid');
const weekdayHeader = document.getElementById('weekdayHeader');
const feedback = document.getElementById('feedback');

const statuses = [
  { value: '', label: 'Not set' },
  { value: 'full', label: 'Full day' },
  { value: 'half', label: 'Half day' },
  { value: 'off', label: 'Day off' }
];

const weekdayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
let monthEntries = {};

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

function createStatusSelect(dateString, currentValue) {
  const select = document.createElement('select');
  select.className = 'form-select form-select-sm mt-2';

  statuses.forEach((status) => {
    const option = document.createElement('option');
    option.value = status.value;
    option.textContent = status.label;
    if (status.value === currentValue) option.selected = true;
    select.appendChild(option);
  });

  select.addEventListener('change', async (event) => {
    try {
      const response = await fetch('api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateString, status: event.target.value })
      });

      if (!response.ok) throw new Error('Failed to save entry');
      if (event.target.value === '') {
        delete monthEntries[dateString];
      } else {
        monthEntries[dateString] = event.target.value;
      }
      showFeedback('Saved');
    } catch (error) {
      showFeedback('Could not save entry', 'danger');
    }
  });

  return select;
}

function renderWeekdayHeader() {
  weekdayHeader.innerHTML = '';
  weekdayNames.forEach((name) => {
    const div = document.createElement('div');
    div.className = 'weekday-label';
    div.textContent = name;
    weekdayHeader.appendChild(div);
  });
}

function renderCalendar(monthString) {
  calendarGrid.innerHTML = '';

  const [year, month] = monthString.split('-').map(Number);
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const offset = (firstDay.getDay() + 6) % 7;
  for (let i = 0; i < offset; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day muted';
    calendarGrid.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month - 1, day);
    const dateString = formatDate(cellDate);

    const card = document.createElement('div');
    card.className = 'calendar-day';

    const dateLabel = document.createElement('div');
    dateLabel.className = 'day-number';
    dateLabel.textContent = day;

    const select = createStatusSelect(dateString, monthEntries[dateString] || '');

    card.appendChild(dateLabel);
    card.appendChild(select);
    calendarGrid.appendChild(card);
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

renderWeekdayHeader();
loadMonth(monthPicker.value);
