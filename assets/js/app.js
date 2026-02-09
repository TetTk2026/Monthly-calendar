const monthPicker = document.getElementById('monthPicker');
const calendarGrid = document.getElementById('calendarGrid');
const feedback = document.getElementById('feedback');

const statuses = [
  { value: '', label: 'Not set' },
  { value: 'full', label: 'Full day' },
  { value: 'half', label: 'Half day' },
  { value: 'off', label: 'Day off' }
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

  const current = monthEntries[dateString] || { status: '', andreas: false };
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

  const current = monthEntries[dateString] || { status: '', andreas: false };
  current.andreas = value;

  if (current.status === '' && !current.andreas) {
    delete monthEntries[dateString];
    return;
  }

  monthEntries[dateString] = current;
}

function createStatusDropdown(dateString, currentValue) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dropdown';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn btn-outline-secondary btn-sm dropdown-toggle status-button';

  const currentStatus = statuses.find((status) => status.value === currentValue) || statuses[0];
  button.textContent = currentStatus.label;

  const menu = document.createElement('ul');
  menu.className = 'dropdown-menu dropdown-menu-end';

  button.addEventListener('click', (event) => {
    event.stopPropagation();
    document.querySelectorAll('.dropdown-menu.show').forEach((openMenu) => {
      if (openMenu !== menu) {
        openMenu.classList.remove('show');
      }
    });
    menu.classList.toggle('show');
  });

  statuses.forEach((status) => {
    const li = document.createElement('li');
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'dropdown-item';
    if (status.value === currentValue) {
      item.classList.add('active');
    }
    item.textContent = status.label;

    item.addEventListener('click', async () => {
      try {
        await saveDayStatus(dateString, status.value);
        button.textContent = status.label;
        menu.querySelectorAll('.dropdown-item').forEach((element) => element.classList.remove('active'));
        item.classList.add('active');
        menu.classList.remove('show');
        showFeedback('Saved');
      } catch (error) {
        showFeedback('Could not save entry', 'danger');
      }
    });

    li.appendChild(item);
    menu.appendChild(li);
  });

  wrapper.appendChild(button);
  wrapper.appendChild(menu);

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
  label.textContent = 'Go to Andreas';

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

function renderCalendar(monthString) {
  calendarGrid.innerHTML = '';

  const [year, month] = monthString.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const cellDate = new Date(year, month - 1, day);
    const dateString = formatDate(cellDate);

    const row = document.createElement('div');
    row.className = 'calendar-day';

    const dayName = document.createElement('div');
    dayName.className = 'day-name';
    dayName.textContent = weekdayNames[cellDate.getDay()];

    const dateLabel = document.createElement('div');
    dateLabel.className = 'day-number';
    dateLabel.textContent = String(day);

    const entry = monthEntries[dateString] || { status: '', andreas: false };
    const dropdown = createStatusDropdown(dateString, entry.status || '');
    const andreasCheckbox = createAndreasCheckbox(dateString, entry.andreas || false);

    row.appendChild(dayName);
    row.appendChild(dateLabel);
    row.appendChild(dropdown);
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

document.addEventListener('click', () => {
  document.querySelectorAll('.dropdown-menu.show').forEach((menu) => menu.classList.remove('show'));
});

loadMonth(monthPicker.value);
