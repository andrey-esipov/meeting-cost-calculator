const rowsContainer = document.getElementById("attendeeRows");
const addRowBtn = document.getElementById("addRow");
const durationInput = document.getElementById("duration");
const recurringSelect = document.getElementById("recurring");
const perMinuteEl = document.getElementById("perMinute");
const perHourEl = document.getElementById("perHour");
const plannedTotalEl = document.getElementById("plannedTotal");
const annualRunRateEl = document.getElementById("annualRunRate");
const annualRunRateItem = document.querySelector(".summary-item.annual-run-rate");
const liveCostEl = document.getElementById("liveCost");
const timerEl = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");
const themeToggle = document.getElementById("themeToggle");
const rateNoteEl = document.getElementById("rateNote");
const breakdownEl = document.getElementById("breakdown");
const summaryModal = document.getElementById("summaryModal");
const summaryDurationEl = document.getElementById("summaryDuration");
const summaryAttendeesEl = document.getElementById("summaryAttendees");
const summaryCostEl = document.getElementById("summaryCost");
const summaryAlternativesEl = document.getElementById("summaryAlternatives");
const summaryFactEl = document.getElementById("summaryFact");
const saveMeetingBtn = document.getElementById("saveMeetingBtn");
const dismissModalBtn = document.getElementById("dismissModalBtn");

let meetingTimer = null;
let elapsedSeconds = 0;
let perMinute = 0;

function renderRoleOptions(select, selectedId) {
  const disciplineOrder = ["Engineering", "Product", "Design", "Content Design", "UX Research", "Data Science", "Management", "Other"];
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

  const fields = document.createElement("div");
  fields.className = "attendee-fields";

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

  fields.appendChild(select);
  fields.appendChild(countInput);
  row.appendChild(fields);
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

  refreshCharts();

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

function getMeetingHistory() {
  const saved = localStorage.getItem("meetingHistory");
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(item => ({
      date: item.date,
      duration: Number(item.duration) || 0,
      cost: Number(item.cost) || 0,
      attendees: Number(item.attendees) || 0
    }));
  } catch (error) {
    return [];
  }
}

function saveMeetingHistory(history) {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  const filtered = history.filter(item => new Date(item.date) >= cutoff);
  localStorage.setItem("meetingHistory", JSON.stringify(filtered));
  return filtered;
}

function refreshCharts() {
  const history = getMeetingHistory();
  const donutData = getHistoryDonutData(history) || getDonutData(perMinute * 60);
  const sparklineData = getHistorySparklineData(history) || getSparklineData(perMinute * 60);
  updateDonut(donutData);
  updateSparkline(sparklineData);
}

function startMeeting() {
  if (meetingTimer) return;
  elapsedSeconds = 0;
  startBtn.textContent = "Running...";
  startBtn.disabled = true;
  stopBtn.classList.remove("hidden");

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
  stopBtn.classList.add("hidden");
  liveCostEl.textContent = formatCurrency(0);
  updateTicker(0);
  timerEl.textContent = "00:00";
}

function stopMeeting() {
  if (!meetingTimer) return;
  clearInterval(meetingTimer);
  meetingTimer = null;
  startBtn.textContent = "Start Meeting";
  startBtn.disabled = false;
  stopBtn.classList.add("hidden");
  showSummaryModal();
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

function getAlternatives(cost) {
  if (cost < 50) {
    const cups = Math.max(1, Math.round(cost / 5));
    return [`☕ ${cups} cups of fancy coffee`, "🥐 A pastry tray for the team"];
  }
  if (cost < 100) {
    return ["🍕 Pizza party for the team", "🎧 A solid pair of headphones"];
  }
  if (cost < 200) {
    return ["🎮 A new video game + snacks for a month", "📚 A stack of productivity books"];
  }
  if (cost < 500) {
    return ["✈️ A weekend getaway flight", "🧳 A premium carry-on suitcase"];
  }
  if (cost < 1000) {
    return ["📱 A new smartphone", "🪑 A top-tier ergonomic chair"];
  }
  if (cost < 2000) {
    return ["🖥️ A high-end monitor setup", "🧑‍💻 A workstation upgrade budget"];
  }
  return ["🚗 A month's car payment", "🏝️ A weekend retreat for the whole team", "🎉 A massive team celebration"];
}

function getFunnyFact(cost, attendees) {
  const perPerson = attendees ? cost / attendees : cost;
  const facts = [
    `That's ${formatCurrency(perPerson)} per person to sit in a room and agree to schedule another meeting.`,
    `Fun fact: This meeting cost more than the CEO's morning coffee... probably.`,
    `At this rate, you could fund a pizza party every hour.`,
    `The PowerPoint slides better be REALLY good for this price.`,
    `This meeting cost enough to buy everyone lunch. But you didn't. 🤔`,
    `Somewhere, a spreadsheet is quietly weeping at ${formatCurrency(cost)}.`,
    `That's ${formatCurrency(cost)} worth of "quick sync."`,
    `You just spent ${formatCurrency(cost)} on alignment. Hope you're aligned.`,
    `That's a ${formatCurrency(perPerson)} per person investment in "just circling back."`,
    `Next time, maybe try a 5-minute voice note? 🤷`
  ];
  return facts[Math.floor(Math.random() * facts.length)];
}

function showSummaryModal() {
  const rows = getRows();
  const duration = elapsedSeconds;
  const totals = computeTotals(rows, Number(durationInput.value || 0));
  const totalCost = perMinute * (elapsedSeconds / 60);

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  summaryDurationEl.textContent = `${minutes} minutes ${seconds} seconds`;
  summaryAttendeesEl.textContent = `${totals.totalAttendees} people`;
  summaryCostEl.textContent = formatCurrency(totalCost);

  const alternatives = getAlternatives(totalCost).slice(0, 3);
  summaryAlternativesEl.innerHTML = alternatives.map(item => `<li>${item}</li>`).join("");
  summaryFactEl.textContent = getFunnyFact(totalCost, totals.totalAttendees);

  summaryModal.classList.add("active");
  summaryModal.setAttribute("aria-hidden", "false");
}

function hideSummaryModal() {
  summaryModal.classList.remove("active");
  summaryModal.setAttribute("aria-hidden", "true");
}

function saveMeetingToHistory() {
  const rows = getRows();
  const totals = computeTotals(rows, Number(durationInput.value || 0));
  const totalCost = perMinute * (elapsedSeconds / 60);
  const history = getMeetingHistory();
  history.push({
    date: new Date().toISOString(),
    duration: elapsedSeconds,
    cost: Number(totalCost.toFixed(2)),
    attendees: totals.totalAttendees
  });
  saveMeetingHistory(history);
  refreshCharts();
  hideSummaryModal();
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
stopBtn.addEventListener("click", stopMeeting);
resetBtn.addEventListener("click", resetMeeting);
copyBtn.addEventListener("click", copySummary);
themeToggle.addEventListener("click", toggleTheme);
saveMeetingBtn.addEventListener("click", saveMeetingToHistory);
dismissModalBtn.addEventListener("click", hideSummaryModal);
summaryModal.addEventListener("click", event => {
  if (event.target === summaryModal) hideSummaryModal();
});

initTicker();
loadSettings();
if (!rowsContainer.children.length) createRow();
const initialHistory = getMeetingHistory();
initDonut(getHistoryDonutData(initialHistory) || getDonutData(0));
initSparkline(getHistorySparklineData(initialHistory) || getSparklineData(0));
updateSummary();
