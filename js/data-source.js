// data-source.js — the seam. The UI asks BR_SOURCE for meetings + insight and
// never knows whether they came from demo data, Microsoft Graph, or Work IQ.
//   - Demo Mode (default): synthetic week from sample-data.js. No sign-in.
//   - Live: Microsoft Graph for meetings/titles (graph.js) + Work IQ for the
//     insight narrative (workiq.js), both delegated-auth via MSAL.
(function () {
  var state = { live: false, account: null };

  function signedInLive() { return state.live && !!state.account; }

  async function meetings() {
    if (signedInLive() && window.BR_GRAPH) return window.BR_GRAPH.getMeetings();
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
    canSignIn: function () { return window.BR_CONFIG.liveAvailable; },
    account: function () { return state.account; },
  };
})();
