// Burn Rate — configuration
// -------------------------------------------------------------------------
// Demo Mode works with ZERO setup. To light up LIVE data (your real calendar
// via Microsoft Graph + Work IQ insights), do the one-time setup in README.md
// and fill in the three values marked "PASTE". Until then, the app runs on
// realistic demo data and every colleague still sees the full experience.
// -------------------------------------------------------------------------
window.BR_CONFIG = {
  appName: "Burn Rate",

  // ---- Microsoft sign-in (MSAL + Microsoft Graph) ----
  msal: {
    clientId: "",                  // PASTE: your Entra app (SPA) Application (client) ID
    tenantId: "organizations",     // PASTE: your tenant GUID (or leave "organizations")
    get authority() { return "https://login.microsoftonline.com/" + this.tenantId; },
    redirectUri: window.location.origin + window.location.pathname,
  },
  // delegated Graph scopes: read your calendar + look up attendee job titles
  graphScopes: ["User.Read", "Calendars.Read", "User.ReadBasic.All"],

  // ---- Work IQ (the "read your week" insight layer) ----
  workIq: {
    proxyUrl: "",                  // PASTE: your deployed proxy URL (see proxy/README.md)
    scope: "api://workiq.svc.cloud.microsoft/WorkIQAgent.Ask",
  },

  // how far back / forward to pull meetings (days)
  pastDays: 14,
  futureDays: 14,

  workHoursPerYear: 2080,          // for annual -> hourly conversion
  hoursPerWeek: 40,                // for "focus time left"
  currency: "USD",
};

// Live mode is available only when a client ID has been provided.
window.BR_CONFIG.liveAvailable = !!window.BR_CONFIG.msal.clientId;
window.BR_CONFIG.workIqAvailable = !!(window.BR_CONFIG.msal.clientId && window.BR_CONFIG.workIq.proxyUrl);
