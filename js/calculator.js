const WORK_HOURS_PER_YEAR = 2080;

function annualToHourly(annual) {
  return annual / WORK_HOURS_PER_YEAR;
}

function computeTotals(rows, durationMinutes) {
  let totalAnnual = 0;
  let totalAttendees = 0;

  rows.forEach(row => {
    const role = ROLE_PRESETS.find(r => r.id === row.roleId);
    const count = Number(row.count || 0);
    if (!role || count <= 0) return;
    totalAnnual += role.annual * count;
    totalAttendees += count;
  });

  const hourly = annualToHourly(totalAnnual);
  const perMinute = hourly / 60;
  const plannedTotal = perMinute * durationMinutes;

  return {
    totalAnnual,
    totalAttendees,
    hourly,
    perMinute,
    plannedTotal
  };
}

function formatCurrency(value) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatTimer(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
