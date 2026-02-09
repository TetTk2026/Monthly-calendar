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

async function saveDayStatus(dateString, value) {
  const response = await fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date: dateString, status: value })
  });

  if (!response.ok) {
    throw new Error('Failed to save entry');
  }

  monthEntries[dateString] = value;
}

function createStatusButtons(dateString, currentValue) {
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
        showFeedback('Saved');
      } catch (error) {
        showFeedback('Could not save entry', 'danger');
      }
    });

    wrapper.appendChild(button);
  });

  return wrapper;
}

function renderCalendar(monthString) {
  calendarGrid.innerHTML = '';

  const [year, month] = monthString.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month - 1, day);
    const dateString = formatDate(cellDate);

    const row = document.createElement('div');
    row.className = 'calendar-day';

    const dateLabel = document.createElement('div');
    dateLabel.className = 'day-number';
    dateLabel.textContent = `${weekdayNames[cellDate.getDay()]} ${day}`;

    const buttons = createStatusButtons(dateString, monthEntries[dateString] || '');

    row.appendChild(dateLabel);
    row.appendChild(buttons);
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
