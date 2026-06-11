// Burn Rate — configuration
// -------------------------------------------------------------------------
// Demo Mode works with ZERO setup. LIVE data (your real calendar via Microsoft
// Graph + Work IQ insights) turns on once a Client ID + proxy URL are present.
// Those can be set two ways:
//   1) In-app: the "Connect" dialog (js/connect.js) saves them to localStorage.
//   2) Hardcoded here: change the defaults in brLS(..., "<default>") below.
// See README.md for the one-time Entra app + proxy setup.
// -------------------------------------------------------------------------
function brLS(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (e) { return fallback; } }

window.BR_CONFIG = {
  appName: "Burn Rate",

  // ---- Microsoft sign-in (MSAL + Microsoft Graph) ----
  msal: {
    clientId: brLS("br_clientId", ""),                 // Entra app (SPA) Application (client) ID
    tenantId: brLS("br_tenantId", "organizations"),    // tenant GUID, or "organizations"
    get authority() { return "https://login.microsoftonline.com/" + this.tenantId; },
    redirectUri: window.location.origin + window.location.pathname,
  },
  graphScopes: ["User.Read", "Calendars.Read", "User.ReadBasic.All"],

  // ---- Work IQ (the "read your week" insight layer) ----
  workIq: {
    proxyUrl: brLS("br_proxyUrl", ""),                 // deployed relay URL (see proxy/README.md)
    scope: "api://workiq.svc.cloud.microsoft/WorkIQAgent.Ask",
  },

  pastDays: 14,
  futureDays: 14,
  workHoursPerYear: 2080,
  hoursPerWeek: 40,
  currency: "USD",
};

window.BR_CONFIG.liveAvailable = !!window.BR_CONFIG.msal.clientId;
window.BR_CONFIG.workIqAvailable = !!(window.BR_CONFIG.msal.clientId && window.BR_CONFIG.workIq.proxyUrl);
