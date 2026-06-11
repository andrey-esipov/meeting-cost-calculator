// data-source.js — the seam. The UI asks BR_SOURCE for meetings + insight and
// never knows whether they came from demo data, Microsoft Graph, or Work IQ.
//   - Demo Mode (default): synthetic week from sample-data.js. No sign-in.
//   - Live: Microsoft Graph for meetings/titles (graph.js) + Work IQ for the
//     insight narrative (workiq.js), both delegated-auth via MSAL.
(function () {
  var state = { live: false, account: null };

  function signedInLive() { return state.live && !!state.account; }

  // Imported data: a colleague's Work IQ agent (Copilot CLI / Claude Code, etc.)
  // emits their real week as JSON; we store it and cost it locally. No Entra app,
  // no proxy — the agent's Work IQ MCP is the M365 connection.
  function normImported(m) {
    if (!m || !m.start) return null;
    var s = new Date(m.start), e = m.end ? new Date(m.end) : null;
    var dur = m.durationMin != null ? m.durationMin : (e ? Math.round((e - s) / 60000) : 30);
    return {
      id: m.id || (m.subject || "m") + "-" + (+s),
      subject: m.subject || "(no subject)",
      start: s, end: e || new Date(+s + dur * 60000), durationMin: dur,
      isRecurring: !!(m.recurring || m.isRecurring), organizer: m.organizer || "", online: true,
      attendees: (m.attendees || []).map(function (a) {
        return { name: a.name || a.email || "", email: a.email || "", jobTitle: a.title || a.jobTitle || "" };
      }),
    };
  }
  function getImported() {
    try {
      var raw = localStorage.getItem("br_meetings");
      if (!raw) return null;
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr) || !arr.length) return null;
      var norm = arr.map(normImported).filter(Boolean);
      return norm.length ? norm : null;
    } catch (e) { return null; }
  }
  function hasImport() { return !signedInLive() && !!getImported(); }

  async function meetings() {
    if (signedInLive() && window.BR_GRAPH) return window.BR_GRAPH.getMeetings();
    var imp = getImported();
    if (imp) return imp;             // imported from a Work IQ agent
    return window.getSampleMeetings();
  }

  // Returns { narrative, recs:[{text,save}] }. Real Work IQ when live+configured,
  // otherwise the canned demo narrative. Never throws to the UI.
  async function insight(week) {
    if (signedInLive() && window.BR_CONFIG.workIqAvailable && window.BR_WORKIQ) {
      try {
        var r = await window.BR_WORKIQ.weekInsight(week);
        if (r) return r;
      } catch (e) { console.warn("[Burn Rate] Work IQ insight failed, using fallback:", e); }
    }
    return window.getSampleInsight(week);
  }

  async function signIn() {
    if (!window.BR_GRAPH || !window.BR_CONFIG.liveAvailable) {
      throw new Error("Live mode isn't configured yet. Add a client ID in js/config.js (see README).");
    }
    var acct = await window.BR_GRAPH.signIn();
    state.live = true; state.account = acct;
    return acct;
  }

  function signOut() {
    state.live = false; state.account = null;
    if (window.BR_GRAPH) window.BR_GRAPH.signOut();
  }

  // Silent restore on load (so a returning user lands already connected).
  async function restore() {
    if (window.BR_GRAPH && window.BR_CONFIG.liveAvailable) {
      try {
        var acct = await window.BR_GRAPH.tryRestore();
        if (acct) { state.live = true; state.account = acct; }
      } catch (e) { /* stay in demo */ }
    }
  }

  window.BR_SOURCE = {
    meetings: meetings,
    insight: insight,
    signIn: signIn,
    signOut: signOut,
    restore: restore,
    isLive: signedInLive,
    isImported: hasImport,
    importJson: function (text) {
      var arr = JSON.parse(text);
      if (!Array.isArray(arr)) throw new Error("Expected a JSON array of meetings.");
      var norm = arr.map(normImported).filter(Boolean);
      if (!norm.length) throw new Error("No valid meetings found in that JSON.");
      localStorage.setItem("br_meetings", JSON.stringify(arr));
      return norm.length;
    },
    clearImport: function () { try { localStorage.removeItem("br_meetings"); } catch (e) {} },
    canSignIn: function () { return window.BR_CONFIG.liveAvailable; },
    account: function () { return state.account; },
  };
})();
