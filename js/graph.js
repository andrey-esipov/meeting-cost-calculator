// graph.js — LIVE data via MSAL + Microsoft Graph (client-side, delegated).
// Dormant until BR_CONFIG.msal.clientId is set. Pulls your real calendar and
// resolves each attendee's job title, so the engine costs your actual meetings.
// Graph is also the token source for Work IQ (workiq.js asks getToken()).
(function () {
  var cfg = window.BR_CONFIG;
  var pca = null;
  var TITLE_CACHE_KEY = "br_title_cache_v1";

  function msalReady() { return typeof msal !== "undefined" && cfg.liveAvailable; }

  async function client() {
    if (pca) return pca;
    if (!msalReady()) throw new Error("MSAL not loaded or client ID missing.");
    pca = new msal.PublicClientApplication({
      auth: { clientId: cfg.msal.clientId, authority: cfg.msal.authority, redirectUri: cfg.msal.redirectUri },
      cache: { cacheLocation: "localStorage", storeAuthStateInCookie: false },
    });
    await pca.initialize();
    // complete any redirect round-trip
    var res = await pca.handleRedirectPromise();
    if (res && res.account) pca.setActiveAccount(res.account);
    return pca;
  }

  async function signIn() {
    var app = await client();
    // Consent to Work IQ at sign-in too (when configured) so the insight token
    // can later be acquired silently.
    var scopes = cfg.graphScopes.slice();
    if (cfg.workIqAvailable && cfg.workIq.scope) scopes.push(cfg.workIq.scope);
    var res = await app.loginPopup({ scopes: scopes, prompt: "select_account" });
    app.setActiveAccount(res.account);
    return res.account;
  }

  async function tryRestore() {
    var app = await client();
    var acct = app.getActiveAccount() || (app.getAllAccounts()[0]);
    if (acct) { app.setActiveAccount(acct); return acct; }
    return null;
  }

  function signOut() {
    if (pca) { var a = pca.getActiveAccount(); if (a) pca.logoutPopup({ account: a }).catch(function () {}); }
  }

  // Acquire a delegated token for any resource (Graph or Work IQ).
  // interactive=false (default) is silent-only — NEVER pop a window without a
  // user gesture (page-load token refreshes would otherwise be blocked and hang).
  async function getToken(scopes, interactive) {
    var app = await client();
    var acct = app.getActiveAccount();
    if (!acct) throw new Error("Not signed in.");
    try {
      var r = await app.acquireTokenSilent({ account: acct, scopes: scopes });
      return r.accessToken;
    } catch (e) {
      if (!interactive) throw e;   // caller (reload/insight) will catch and fall back to demo
      var r2 = await app.acquireTokenPopup({ scopes: scopes });
      return r2.accessToken;
    }
  }

  async function graphGET(url, token) {
    var res = await fetch(url, {
      headers: {
        Authorization: "Bearer " + token,
        Prefer: 'outlook.timezone="' + (Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC") + '"',
      },
    });
    if (res.status === 429) { // throttled — back off once
      await new Promise(function (r) { setTimeout(r, (Number(res.headers.get("Retry-After")) || 2) * 1000); });
      return graphGET(url, token);
    }
    if (!res.ok) throw new Error("Graph " + res.status + " " + url);
    return res.json();
  }

  function loadTitleCache() { try { return JSON.parse(localStorage.getItem(TITLE_CACHE_KEY) || "{}"); } catch (e) { return {}; } }
  function saveTitleCache(c) { try { localStorage.setItem(TITLE_CACHE_KEY, JSON.stringify(c)); } catch (e) {} }

  // Build an email -> jobTitle map from /me/people (scope People.Read, no admin
  // consent). This covers the colleagues you actually meet with; unknowns fall
  // back to an estimated band in titles.js. One call, cached.
  async function resolvePeopleTitles(token) {
    var map = loadTitleCache();
    try {
      var data = await graphGET("https://graph.microsoft.com/v1.0/me/people?$top=1000&$select=displayName,jobTitle,scoredEmailAddresses", token);
      (data.value || []).forEach(function (p) {
        var title = p.jobTitle || "";
        (p.scoredEmailAddresses || []).forEach(function (e) {
          if (e.address) map[e.address.toLowerCase()] = title;
        });
      });
      saveTitleCache(map);
    } catch (e) { console.warn("[Burn Rate] /me/people failed:", e); }
    return map;
  }

  // Graph returns local-time strings (no 'Z') with 7 fractional digits when we
  // send Prefer: outlook.timezone. Most engines parse that, but be defensive:
  // fall back to an explicit local-time parse so a meeting never lands as NaN.
  function toDate(g) {
    if (!g || !g.dateTime) return null;
    var d = new Date(g.dateTime);
    if (!isNaN(d.getTime())) return d;
    var m = g.dateTime.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
  }

  async function getMeetings() {
    var token = await getToken(cfg.graphScopes);
    var now = new Date();
    var start = new Date(now); start.setDate(now.getDate() - cfg.pastDays);
    var end = new Date(now); end.setDate(now.getDate() + cfg.futureDays);
    var url = "https://graph.microsoft.com/v1.0/me/calendarView"
      + "?startDateTime=" + encodeURIComponent(start.toISOString())
      + "&endDateTime=" + encodeURIComponent(end.toISOString())
      + "&$select=subject,start,end,attendees,organizer,isCancelled,isAllDay,onlineMeeting,type,recurrence"
      + "&$orderby=start/dateTime&$top=100";

    var events = [], page = url, guard = 0;
    while (page && guard++ < 25) {           // up to 2500 events over the window
      var data = await graphGET(page, token);
      events = events.concat(data.value || []);
      page = data["@odata.nextLink"];
    }
    if (page) console.warn("[Burn Rate] calendar truncated at " + events.length + " events");
    events = events.filter(function (e) { return !e.isCancelled && !e.isAllDay; });

    // resolve attendee job titles via /me/people (People.Read, no admin consent)
    var titles = await resolvePeopleTitles(token);
    try {   // add the signed-in user's own title (from /me, User.Read)
      var me = await graphGET("https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName,jobTitle", token);
      var myEmail = (me.mail || me.userPrincipalName || "").toLowerCase();
      if (myEmail) titles[myEmail] = me.jobTitle || "";
    } catch (e) {}

    return events.map(function (e) {
      var s = toDate(e.start), en = toDate(e.end);
      return {
        id: e.id,
        subject: e.subject || "(no subject)",
        start: s, end: en,
        durationMin: s && en ? Math.round((en - s) / 60000) : 30,
        isRecurring: e.type === "occurrence" || e.type === "seriesMaster" || !!e.recurrence,
        organizer: e.organizer && e.organizer.emailAddress ? e.organizer.emailAddress.name : "",
        online: !!e.onlineMeeting,
        attendees: (e.attendees || []).map(function (a) {
          var addr = a.emailAddress ? a.emailAddress.address : "";
          return { name: a.emailAddress ? a.emailAddress.name : addr, email: addr, jobTitle: titles[(addr || "").toLowerCase()] || "" };
        }),
      };
    });
  }

  window.BR_GRAPH = { signIn: signIn, tryRestore: tryRestore, signOut: signOut, getMeetings: getMeetings, getToken: getToken };
})();
