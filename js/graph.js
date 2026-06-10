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
    var res = await app.loginPopup({ scopes: cfg.graphScopes, prompt: "select_account" });
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
  async function getToken(scopes) {
    var app = await client();
    var acct = app.getActiveAccount();
    if (!acct) throw new Error("Not signed in.");
    try {
      var r = await app.acquireTokenSilent({ account: acct, scopes: scopes });
      return r.accessToken;
    } catch (e) {
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

  // Resolve job titles for a set of emails via $batch (<=20/request), cached.
  async function resolveTitles(emails, token) {
    var cache = loadTitleCache();
    var misses = emails.filter(function (e) { return e && !(e.toLowerCase() in cache); });
    for (var i = 0; i < misses.length; i += 20) {
      var slice = misses.slice(i, i + 20);
      var body = {
        requests: slice.map(function (e, idx) {
          return { id: String(idx), method: "GET", url: "/users/" + encodeURIComponent(e) + "?$select=displayName,jobTitle,department" };
        }),
      };
      var res = await fetch("https://graph.microsoft.com/v1.0/$batch", {
        method: "POST",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      var data = await res.json();
      (data.responses || []).forEach(function (r) {
        var email = slice[Number(r.id)];
        cache[email.toLowerCase()] = (r.status === 200 && r.body) ? (r.body.jobTitle || "") : "";
      });
    }
    saveTitleCache(cache);
    return cache;
  }

  function toDate(g) { return g && g.dateTime ? new Date(g.dateTime) : null; }

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
    while (page && guard++ < 10) {
      var data = await graphGET(page, token);
      events = events.concat(data.value || []);
      page = data["@odata.nextLink"];
    }
    events = events.filter(function (e) { return !e.isCancelled && !e.isAllDay; });

    // resolve titles for all attendees
    var emails = {};
    events.forEach(function (e) { (e.attendees || []).forEach(function (a) { if (a.emailAddress) emails[a.emailAddress.address] = 1; }); });
    var titles = await resolveTitles(Object.keys(emails), token);

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
