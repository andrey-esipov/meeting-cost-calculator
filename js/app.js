// app.js — orchestration + rendering for Burn Rate.
(function () {
  var E = window.BR_ENGINE, S = window.BR_SOURCE, CFG = window.BR_CONFIG;
  var $ = function (id) { return document.getElementById(id); };
  var state = { meetings: [], week: null, upcoming: null };

  /* ---------- tiny helpers ---------- */
  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function countUp(el, target) {
    var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
    if (reduce) { el.textContent = E.money(target); return; }
    var t0 = null, dur = 1100;
    function step(ts) {
      if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = E.money(target * e); if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function timeLabel(d) {
    d = new Date(d);
    return d.toLocaleDateString("en-US", { weekday: "short" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }

  /* ---------- theme ---------- */
  function initTheme() {
    var saved = localStorage.getItem("br_theme") || "dark";
    document.documentElement.setAttribute("data-theme", saved);
    $("themeBtn").addEventListener("click", function () {
      var next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("br_theme", next);
    });
  }

  /* ---------- nav ---------- */
  function showView(name) {
    document.querySelectorAll(".view").forEach(function (v) { v.hidden = v.id !== "view-" + name; });
    document.querySelectorAll(".navbtn").forEach(function (b) { b.classList.toggle("on", b.dataset.view === name); });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function initNav() {
    document.querySelectorAll(".navbtn").forEach(function (b) { b.addEventListener("click", function () { showView(b.dataset.view); }); });
    document.querySelectorAll("[data-go]").forEach(function (b) { b.addEventListener("click", function () { showView(b.dataset.go); }); });
  }

  /* ---------- connection (sign in / out) ---------- */
  function renderConn() {
    var btn = $("connBtn"), label = $("connLabel"), dot = btn.querySelector(".dot");
    if (S.isLive()) {
      var name = (S.account() && (S.account().name || S.account().username)) || "Connected";
      btn.classList.add("live"); label.textContent = "Connected · Work IQ"; btn.dataset.short = "Live"; btn.title = name + " — click to sign out";
    } else if (S.canSignIn()) {
      btn.classList.remove("live"); label.textContent = "Sign in with Microsoft"; btn.dataset.short = "Sign in"; btn.title = "Connect your real calendar";
    } else {
      btn.classList.remove("live"); label.textContent = "Demo data"; btn.dataset.short = "Demo"; btn.title = "Add a client ID in js/config.js to go live (see README)";
    }
  }
  function initConn() {
    $("connBtn").addEventListener("click", async function () {
      if (S.isLive()) { S.signOut(); toast("Signed out — back to demo data."); return reload(); }
      if (!S.canSignIn()) { return toast("Demo mode. Add a client ID in js/config.js to connect your real calendar (see README)."); }
      try { toast("Opening Microsoft sign-in…"); await S.signIn(); toast("Connected. Loading your real week…"); reload(); }
      catch (e) { toast("Sign-in failed: " + e.message); }
    });
  }

  /* ---------- This Week ---------- */
  function renderWeek(w) {
    state.week = w;
    $("heroEyebrow").textContent = (S.isLive() ? "Your meetings" : "Your meetings (demo)") + " · this week";
    countUp($("bignum"), w.total);

    var delta = $("delta");
    if (w.deltaPct != null) {
      var up = w.deltaPct >= 0;
      delta.hidden = false;
      delta.textContent = (up ? "▲ " : "▼ ") + Math.abs(w.deltaPct) + "% vs last week";
      delta.style.color = up ? "var(--rise)" : "var(--green)";
      delta.style.background = up ? "rgba(255,86,110,.12)" : "rgba(31,191,115,.12)";
      delta.style.borderColor = up ? "rgba(255,86,110,.28)" : "rgba(31,191,115,.3)";
    } else { delta.hidden = true; }

    $("substat").innerHTML = w.count
      ? "<b>" + w.count + "</b> meetings · <b>" + w.hours + "</b> hours · <b>" + w.people + "</b> people on your calendar"
      : "No meetings this week. Enjoy the quiet. 🎉";

    // cost by day
    var max = Math.max.apply(null, w.byDay.map(function (d) { return d.cost; }).concat([1]));
    var peak = w.byDay.reduce(function (a, b) { return b.cost > a.cost ? b : a; }, w.byDay[0]);
    $("days").innerHTML = w.byDay.map(function (d) {
      var h = Math.round((d.cost / max) * 84);
      return '<div class="day' + (d === peak && d.cost > 0 ? " peak" : "") + '">' +
        '<div class="b" data-h="' + h + '"></div>' +
        '<div class="v">' + E.moneyK(d.cost) + '</div><div class="l">' + d.label + '</div></div>';
    }).join("");
    requestAnimationFrame(function () { $("days").querySelectorAll(".b").forEach(function (b) { b.style.height = b.dataset.h + "px"; }); });

    // trio
    if (w.mostExpensive) {
      $("statTopCost").textContent = E.money(w.mostExpensive.cost);
      var m = w.mostExpensive.meeting;
      $("statTopMeta").textContent = m.subject + " · " + m.attendees.length + " people · " + m.durationMin + " min";
    } else { $("statTopCost").textContent = "—"; $("statTopMeta").textContent = "no meetings"; }
    $("statEmail").textContent = w.emailable.count + (w.emailable.count === 1 ? " meeting" : " meetings");
    $("statEmailMeta").textContent = w.emailable.count ? "≈ " + E.money(w.emailable.cost) + " of low-interaction time" : "nice — everything earned its slot";
    $("statFocus").textContent = w.focusHoursLeft + " hrs";
    $("statFocusMeta").textContent = w.focusPct + "% of your work week";

    // leaderboard
    var medals = ["🥇", "🥈", "🥉", "🔥", "5"];
    var emoji = ["💸", "📊", "☕", "📧", ""];
    $("leaderboard").innerHTML = w.leaderboard.length ? w.leaderboard.map(function (it, i) {
      var m = it.meeting;
      var quick = /quick/i.test(m.subject) ? ' <span class="tag-quick">(it was not quick)</span>' : "";
      return '<div class="row" style="--d:' + (i * 70) + '"><span class="rank">' + (medals[i] || (i + 1)) + '</span>' +
        '<div><div class="t">' + escapeHtml(m.subject) + quick + '</div>' +
        '<div class="meta">' + m.attendees.length + " attendees · " + m.durationMin + " min" + (m.isRecurring ? " · recurring" : "") + '</div></div>' +
        '<span class="cost">' + E.money(it.cost) + (emoji[i] ? ' <span class="e">' + emoji[i] + "</span>" : "") + "</span></div>";
    }).join("") : '<div class="row"><div class="meta">No meetings this week.</div></div>';

    $("footNote").textContent = (S.isLive()
      ? "Titles resolved via Microsoft Graph"
      : "Demo data — sign in to cost your real calendar") +
      " · salaries estimated from levels.fyi · insights by Work IQ · for laughs, not payroll 🙂";
  }

  function renderInsight(ins) {
    $("wiqNarrative").classList.remove("skel");
    $("wiqNarrative").innerHTML = ins.narrative || "No standout patterns this week.";
    var badge = $("wiqBadge");
    badge.textContent = S.isLive() && CFG.workIqAvailable ? "live" : "demo";
    badge.classList.toggle("live", S.isLive() && CFG.workIqAvailable);
    $("wiqRecs").innerHTML = (ins.recs || []).map(function (r) {
      return '<div class="rec"><span class="chk">→</span><div>' + r.text + "</div>" +
        (r.save ? '<span class="save">' + escapeHtml(r.save) + "</span>" : "") + "</div>";
    }).join("");
  }

  /* ---------- Upcoming ---------- */
  function renderUpcoming(u) {
    state.upcoming = u;
    countUp($("upTotal"), u.total);
    $("upSub").innerHTML = "<b>" + u.count + "</b> meetings already booked · projected <b>" + E.money(u.total) + "</b>";
    var byCost = u.items.slice().sort(function (a, b) { return b.cost - a.cost; }).slice(0, 12);
    $("upList").innerHTML = byCost.length ? byCost.map(function (it, i) {
      var m = it.meeting;
      return '<div class="row" style="--d:' + (Math.min(i, 12) * 45) + '"><span class="rank">' + (E.isEmailable(m) ? "📧" : "📅") + '</span>' +
        '<div><div class="t">' + escapeHtml(m.subject) + '</div>' +
        '<div class="meta">' + timeLabel(m.start) + " · " + m.attendees.length + " people · " + m.durationMin + " min</div></div>" +
        '<span class="cost">' + E.money(it.cost) + "</span></div>";
    }).join("") : '<div class="row"><div class="meta">Nothing on the calendar. Rare.</div></div>';
  }

  /* ---------- Quick estimate (manual, no sign-in) ---------- */
  function roleOptions(selected) {
    var order = ["Engineering", "Product", "Design", "Content Design", "UX Research", "Data Science", "Management", "Other"];
    var byDisc = {};
    ROLE_PRESETS.forEach(function (r) { (byDisc[r.discipline] = byDisc[r.discipline] || []).push(r); });
    return order.filter(function (d) { return byDisc[d]; }).map(function (d) {
      return '<optgroup label="' + d + '">' + byDisc[d].map(function (r) {
        return '<option value="' + r.id + '"' + (r.id === selected ? " selected" : "") + ">" + r.name + " (L" + r.level + ") — $" + r.annual.toLocaleString() + "</option>";
      }).join("") + "</optgroup>";
    }).join("");
  }
  function qRow(roleId, count) {
    var div = document.createElement("div"); div.className = "qrow";
    div.innerHTML = '<select>' + roleOptions(roleId) + '</select><input type="number" min="1" value="' + (count || 1) + '" /><button class="x" title="Remove">×</button>';
    div.querySelector(".x").addEventListener("click", function () { div.remove(); qCompute(); });
    div.querySelectorAll("select,input").forEach(function (el) { el.addEventListener("input", qCompute); });
    return div;
  }
  function qCompute() {
    var rows = Array.from($("qRows").children).map(function (r) {
      return { roleId: r.querySelector("select").value, count: Number(r.querySelector("input").value) || 0 };
    });
    var dur = Number($("qDuration").value) || 0;
    var t = computeTotals(rows, dur); // from calculator.js
    $("qTotal").textContent = E.money(t.plannedTotal);
    $("qPerHour").innerHTML = "<b>" + E.money(t.hourly) + "</b>/hour · " + t.totalAttendees + " people";
    $("qAnnual").textContent = "If this is weekly, that's " + E.money(t.plannedTotal * 50) + " a year.";
  }
  function initQuick() {
    var seed = [["senior-pm-l62", 1], ["em-l64", 1], ["sde-l60", 2], ["senior-sde-l62", 1]];
    seed.forEach(function (s) { $("qRows").appendChild(qRow(s[0], s[1])); });
    $("qAdd").addEventListener("click", function () { $("qRows").appendChild(qRow(ROLE_PRESETS[0].id, 1)); qCompute(); });
    $("qDuration").addEventListener("input", qCompute);
    qCompute();
  }

  /* ---------- share ---------- */
  function initShare() {
    $("flexBtn").addEventListener("click", async function () {
      if (!state.week) return;
      $("flexBtn").disabled = true;
      var r = await window.BR_SHARE.copyForTeams(state.week);
      toast(r === "image-copied" ? "Card copied — paste it into Teams 🔥" : "Card downloaded — drop it into Teams 🔥");
      $("flexBtn").disabled = false;
    });
    $("copyBtn").addEventListener("click", function () {
      if (!state.week) return;
      navigator.clipboard.writeText(window.BR_SHARE.teamsMarkdown(state.week))
        .then(function () { toast("Summary copied to clipboard."); });
    });
  }

  function escapeHtml(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  /* ---------- load / reload ---------- */
  async function reload() {
    renderConn();
    $("wiqNarrative").classList.add("skel"); $("wiqNarrative").textContent = "Reading your week…"; $("wiqRecs").innerHTML = "";
    try {
      state.meetings = await S.meetings();
    } catch (e) {
      // Live load failed (token, network, throttle). Never strand the user on a
      // spinner — drop to demo data so the dashboard always renders.
      console.warn("[Burn Rate] live load failed, falling back to demo:", e);
      if (S.isLive()) S.signOut();
      renderConn();
      toast("Couldn't load your calendar — showing demo data.");
      state.meetings = window.getSampleMeetings();
    }
    renderWeek(E.computeWeek(state.meetings));
    renderUpcoming(E.computeUpcoming(state.meetings));
    try { renderInsight(await S.insight(state.week)); }
    catch (e) { renderInsight({ narrative: "Couldn't load insights right now.", recs: [] }); }
  }

  // Pixel-art office backdrop + rising embers (the "money burning" motif).
  function buildPixelLayer() {
    var office = $("pixelOffice");
    if (office && !office.children.length) {
      var cols = 16, rows = 7, frag = document.createDocumentFragment();
      office.style.setProperty("--cols", cols);
      for (var i = 0; i < cols * rows; i++) {
        var w = document.createElement("div");
        if (Math.random() < 0.4) {
          w.className = "win lit" + (Math.random() < 0.55 ? " occ" : "");
          w.style.setProperty("--fl", (2.2 + Math.random() * 4).toFixed(2) + "s");
          w.style.setProperty("--fd", (Math.random() * 3.5).toFixed(2) + "s");
        } else { w.className = "win"; }
        frag.appendChild(w);
      }
      office.appendChild(frag);
    }
    var embers = $("pixelEmbers");
    if (embers && !embers.children.length) {
      for (var j = 0; j < 18; j++) {
        var p = document.createElement("div");
        p.className = "pe";
        p.style.left = (Math.random() * 100).toFixed(1) + "%";
        p.style.setProperty("--ed", (4 + Math.random() * 4.5).toFixed(2) + "s");
        p.style.setProperty("--epd", (Math.random() * 6).toFixed(2) + "s");
        p.style.setProperty("--ex", (Math.random() * 44 - 22).toFixed(0) + "px");
        embers.appendChild(p);
      }
    }
  }

  async function init() {
    initTheme(); initNav(); initConn(); initShare(); initQuick(); buildPixelLayer();
    try { await S.restore(); } catch (e) {}
    await reload();
  }
  init();
})();
