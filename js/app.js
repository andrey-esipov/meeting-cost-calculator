const rowsContainer = document.getElementById("attendeeRows");
const addRowBtn = document.getElementById("addRow");
const durationInput = document.getElementById("duration");
const perMinuteEl = document.getElementById("perMinute");
const perHourEl = document.getElementById("perHour");
const plannedTotalEl = document.getElementById("plannedTotal");
const liveCostEl = document.getElementById("liveCost");
const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");
const themeToggle = document.getElementById("themeToggle");
const rateNoteEl = document.getElementById("rateNote");
const breakdownEl = document.getElementById("breakdown");

let meetingTimer = null;
let elapsedSeconds = 0;
let perMinute = 0;

function renderRoleOptions(select, selectedId) {
  const disciplineOrder = ["Engineering", "Product", "Design", "Management", "Other"];
  const grouped = ROLE_PRESETS.reduce((acc, role) => {
    acc[role.discipline] = acc[role.discipline] || [];
    acc[role.discipline].push(role);
    return acc;
  }, {});

  disciplineOrder.forEach(discipline => {
    const roles = grouped[discipline];
    if (!roles || !roles.length) return;
    const optgroup = document.createElement("optgroup");
    optgroup.label = discipline;

    roles.forEach(role => {
      const option = document.createElement("option");
      option.value = role.id;
      option.textContent = `${role.name} (L${role.level}) — $${role.annual.toLocaleString()}`;
      if (role.id === selectedId) option.selected = true;
      optgroup.appendChild(option);
    });

    select.appendChild(optgroup);
  });
}

function createRow(rowData = { roleId: ROLE_PRESETS[0].id, count: 1 }) {
  const row = document.createElement("div");
  row.className = "attendee-row";

  const select = document.createElement("select");
  renderRoleOptions(select, rowData.roleId);

  const countInput = document.createElement("input");
  countInput.type = "number";
  countInput.min = 1;
  countInput.value = rowData.count || 1;

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn small";
  removeBtn.textContent = "Remove";

  removeBtn.addEventListener("click", () => {
    row.remove();
    if (!rowsContainer.children.length) {
      createRow();
    }
    updateSummary();
  });

  [select, countInput].forEach(el => el.addEventListener("change", updateSummary));

  row.appendChild(select);
  row.appendChild(countInput);
  row.appendChild(removeBtn);
  rowsContainer.appendChild(row);
}

function getRows() {
  return Array.from(rowsContainer.children).map(row => {
    const [select, input] = row.querySelectorAll("select, input");
    return { roleId: select.value, count: Number(input.value) || 0 };
  });
}

function updateSummary() {
  const rows = getRows();
  const duration = Number(durationInput.value || 0);
  const totals = computeTotals(rows, duration);
  perMinute = totals.perMinute;

  perMinuteEl.textContent = formatCurrency(totals.perMinute);
  perHourEl.textContent = formatCurrency(totals.hourly);
  plannedTotalEl.textContent = formatCurrency(totals.plannedTotal);

  if (rateNoteEl) {
    rateNoteEl.textContent = `This meeting costs ${formatCurrency(totals.hourly)} per hour (${formatCurrency(totals.perMinute)} per minute).`;
  }

  if (breakdownEl) {
    const breakdownItems = rows
      .map(row => {
        const role = ROLE_PRESETS.find(r => r.id === row.roleId);
        const count = Number(row.count || 0);
        if (!role || count <= 0) return null;
        return {
          label: `${role.name} (L${role.level}) × ${count}`,
          hourly: annualToHourly(role.annual * count)
        };
      })
      .filter(Boolean);

    if (totals.totalAttendees > 1 && breakdownItems.length) {
      breakdownEl.style.display = "grid";
      breakdownEl.innerHTML = breakdownItems
        .map(item => `
          <div class="breakdown-item">
            <span>${item.label}</span>
            <span>${formatCurrency(item.hourly)} / hr</span>
          </div>
        `)
        .join("");
    } else {
      breakdownEl.style.display = "none";
      breakdownEl.innerHTML = "";
    }
  }

  updateDonut(getDonutData(totals.hourly));
  updateSparkline(getSparklineData(totals.hourly));

  if (!meetingTimer) {
    liveCostEl.textContent = formatCurrency(0);
    updateTicker(0);
    timerEl.textContent = "00:00";
  }

  saveSettings();
}

function getDonutData(hourlyCost) {
  return MEETING_TYPES.map(type => ({
    type: type.type,
    value: hourlyCost * 5 * type.weight
  }));
}

function getSparklineData(hourlyCost) {
  return TREND_BASE.map(base => base * (hourlyCost / 100));
}

function startMeeting() {
  if (meetingTimer) return;
  elapsedSeconds = 0;
  startBtn.textContent = "Running...";
  startBtn.disabled = true;

  meetingTimer = setInterval(() => {
    elapsedSeconds += 1;
    const liveCost = perMinute * (elapsedSeconds / 60);
    liveCostEl.textContent = formatCurrency(liveCost);
    updateTicker(liveCost);
    timerEl.textContent = formatTimer(elapsedSeconds);
  }, 1000);
}

function resetMeeting() {
  clearInterval(meetingTimer);
  meetingTimer = null;
  elapsedSeconds = 0;
  startBtn.textContent = "Start Meeting";
  startBtn.disabled = false;
  liveCostEl.textContent = formatCurrency(0);
  updateTicker(0);
  timerEl.textContent = "00:00";
}

function copySummary() {
  const rows = getRows();
  const duration = Number(durationInput.value || 0);
  const totals = computeTotals(rows, duration);
  const text = `Meeting summary\nAttendees: ${totals.totalAttendees}\nPer minute: ${formatCurrency(totals.perMinute)}\nPer hour: ${formatCurrency(totals.hourly)}\nPlanned total (${duration} min): ${formatCurrency(totals.plannedTotal)}`;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy Summary"), 1200);
  });
}

function saveSettings() {
  const settings = {
    duration: durationInput.value,
    rows: getRows(),
    theme: document.body.dataset.theme || "light"
  };
  localStorage.setItem("meetingSettings", JSON.stringify(settings));
}

function loadSettings() {
  const saved = localStorage.getItem("meetingSettings");
  if (!saved) return;
  const settings = JSON.parse(saved);
  durationInput.value = settings.duration || 30;
  rowsContainer.innerHTML = "";
  (settings.rows || []).forEach(row => createRow(row));
  if (!rowsContainer.children.length) createRow();
  if (settings.theme) {
    document.body.dataset.theme = settings.theme;
  }
}

function toggleTheme() {
  const current = document.body.dataset.theme;
  document.body.dataset.theme = current === "dark" ? "light" : "dark";
  saveSettings();
}

addRowBtn.addEventListener("click", () => createRow());
durationInput.addEventListener("change", updateSummary);
startBtn.addEventListener("click", startMeeting);
resetBtn.addEventListener("click", resetMeeting);
copyBtn.addEventListener("click", copySummary);
themeToggle.addEventListener("click", toggleTheme);

initTicker();
loadSettings();
if (!rowsContainer.children.length) createRow();
initDonut(getDonutData(0));
initSparkline(getSparklineData(0));
updateSummary();
