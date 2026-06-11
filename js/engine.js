// engine.js — turn a list of normalized meetings into the numbers the
// dashboard shows. Pure functions; reuses annualToHourly (calculator.js) and
// mapTitleToComp (titles.js). Works identically for demo data and Graph data.
//
// Normalized Meeting shape:
//   { id, subject, start: Date|ISO, end: Date|ISO, durationMin, isRecurring,
//     organizer, online, attendees: [{ name, email, jobTitle, annualComp? , spoke? }] }

(function () {
  var WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

  function d(x) { return x instanceof Date ? x : new Date(x); }

  function attendeeAnnual(a) {
    if (a && a.annualComp != null) return a.annualComp;
    return mapTitleToComp(a ? a.jobTitle : "").annual;
  }

  function perHour(m) {
    return (m.attendees || []).reduce(function (s, a) { return s + annualToHourly(attendeeAnnual(a)); }, 0);
  }
  function meetingCost(m) {
    var mins = m.durationMin != null ? m.durationMin : (d(m.end) - d(m.start)) / 60000;
    return perHour(m) * (mins / 60);
  }

  // "Could this have been an email?" — keyword + size + recurrence + (demo) talk ratio.
  function isEmailable(m) {
    var s = (m.subject || "").toLowerCase();
    var statusy = /(status|update|\bsync\b|standup|stand-up|check[- ]?in|read-?out|fyi|weekly|daily|recap|touch ?base|catch ?up|align)/.test(s);
    var big = (m.attendees || []).length >= 8;
    var spoke = (m.attendees || []).filter(function (a) { return a.spoke; }).length;
    var lowTalk = (m.attendees || []).some(function (a) { return a.spoke != null; })
      ? (spoke / Math.max(1, (m.attendees || []).length) < 0.35) : false;
    var score = (statusy ? 2 : 0) + (big ? 1 : 0) + (m.isRecurring ? 1 : 0) + (lowTalk ? 2 : 0);
    return score >= 3;
  }

  function startOfWeek(date) {
    var x = new Date(date); x.setHours(0, 0, 0, 0);
    var day = (x.getDay() + 6) % 7;            // Mon=0
    x.setDate(x.getDate() - day);
    return x;
  }
  function inRange(t, a, b) { return t >= a && t < b; }

  // Everything the "This Week" view needs.
  function computeWeek(meetings, refDate) {
    var ref = refDate ? new Date(refDate) : new Date();
    var wkStart = startOfWeek(ref);
    var wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 7);
    var prevStart = new Date(wkStart); prevStart.setDate(wkStart.getDate() - 7);

    // Work week (Mon-Fri) only, so the day-bars reconcile with the headline total.
    var week = [], prev = [];
    meetings.forEach(function (m) {
      var t = d(m.start);
      if (((t.getDay() + 6) % 7) >= 5) return;   // skip Sat/Sun
      if (inRange(t, wkStart, wkEnd)) week.push(m);
      else if (inRange(t, prevStart, wkStart)) prev.push(m);
    });

    var withCost = week.map(function (m) { return { m: m, cost: meetingCost(m) }; });
    var total = withCost.reduce(function (s, x) { return s + x.cost; }, 0);
    var prevTotal = prev.reduce(function (s, m) { return s + meetingCost(m); }, 0);
    var deltaPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;

    var hours = week.reduce(function (s, m) { return s + (m.durationMin || 0) / 60; }, 0);
    var people = {};
    week.forEach(function (m) { (m.attendees || []).forEach(function (a) { people[a.email || a.name] = 1; }); });

    // cost by weekday (Mon-Fri)
    var byDay = WEEKDAYS.map(function (lbl) { return { label: lbl, cost: 0 }; });
    withCost.forEach(function (x) {
      var idx = (d(x.m.start).getDay() + 6) % 7;
      if (idx < 5) byDay[idx].cost += x.cost;
    });

    // leaderboard (most expensive)
    var leaderboard = withCost.slice().sort(function (a, b) { return b.cost - a.cost; })
      .slice(0, 5).map(function (x) { return { meeting: x.m, cost: x.cost }; });

    // could've-been-an-email
    var emailable = withCost.filter(function (x) { return isEmailable(x.m); });
    var emailableCost = emailable.reduce(function (s, x) { return s + x.cost; }, 0);

    var focusLeft = Math.max(0, (BR_CONFIG.hoursPerWeek || 40) - hours);

    return {
      weekStart: wkStart,
      total: total,
      deltaPct: deltaPct,
      count: week.length,
      hours: Math.round(hours),
      people: Object.keys(people).length,
      byDay: byDay,
      leaderboard: leaderboard,
      mostExpensive: leaderboard[0] || null,
      emailable: { count: emailable.length, cost: emailableCost, list: emailable.map(function (x) { return x.m; }) },
      focusHoursLeft: Math.round(focusLeft),
      focusPct: Math.round((focusLeft / (BR_CONFIG.hoursPerWeek || 40)) * 100),
    };
  }

  // Upcoming view: future meetings (after now), with projected cost.
  function computeUpcoming(meetings, refDate) {
    var now = refDate ? new Date(refDate) : new Date();
    var future = meetings.filter(function (m) { return d(m.start) >= now; })
      .map(function (m) { return { meeting: m, cost: meetingCost(m) }; })
      .sort(function (a, b) { return d(a.meeting.start) - d(b.meeting.start); });
    var total = future.reduce(function (s, x) { return s + x.cost; }, 0);
    return { total: total, count: future.length, items: future };
  }

  // money formatters for the dashboard (no cents)
  function money(n) {
    return "$" + Math.round(n).toLocaleString("en-US");
  }
  function moneyK(n) {
    if (n >= 1000) return "$" + (n / 1000).toFixed(n >= 10000 ? 0 : 1) + "k";
    return "$" + Math.round(n);
  }

  window.BR_ENGINE = {
    meetingCost: meetingCost, isEmailable: isEmailable, perHour: perHour,
    computeWeek: computeWeek, computeUpcoming: computeUpcoming,
    money: money, moneyK: moneyK, attendeeAnnual: attendeeAnnual,
  };
})();
