# 🔥 Burn Rate

**See what your meetings actually cost.** Sign in once and Burn Rate pulls your real
past and upcoming meetings from your calendar, resolves every attendee's title, and
tells you — to the dollar — what your week of meetings cost. Then **Work IQ** reads
your week and tells you what to cut.

No spreadsheets. No typing in attendees. Open the link → see the damage.

> **[Live demo →](https://andrey-esipov.github.io/meeting-cost-calculator/)** — runs on
> realistic demo data with zero sign-in, so anyone can try it instantly.

![Burn Rate](assets/hero-ember.webp)

## What it does

- **This Week** — a cinematic count-up of your total meeting cost, ▲/▼ vs last week,
  cost-by-day, and a **Meeting Leaderboard** of your priciest meetings.
- **Could've been an email** — flags low-interaction status/sync meetings and totals the spend.
- **Work IQ reads your week** — a real, grounded insight + 3 money-saving recommendations.
- **Upcoming** — the projected cost of everything already on your calendar (decline early, keep the cash).
- **Quick estimate** — price a meeting before you send the invite. No sign-in.
- **Flex on Teams** — one click generates a share card you paste into Teams.

## How it works

Burn Rate is a zero-build static site (HTML/CSS/vanilla JS, hosted on GitHub Pages).
A pluggable data layer means the UI is identical in demo and live mode:

| Layer | Demo mode | Live mode |
| --- | --- | --- |
| **Meetings + titles** | `js/sample-data.js` | **Microsoft Graph** via MSAL (`js/graph.js`) — `calendarView` + batched `jobTitle` lookups |
| **Cost** | `js/titles.js` maps each title → a Microsoft comp band (`js/data.js`), `js/engine.js` does the math |
| **"Read your week"** | canned narrative | **Work IQ A2A** (`js/workiq.js`) through a thin proxy (`proxy/`) |

Graph gives the exact, structured data; Work IQ gives the judgment. Each does what it's best at.

## Use it on your real calendar — the easy way (Work IQ agent)

If you already have the **Work IQ MCP** wired into an agent (Copilot CLI, Claude Code, etc.),
that agent *is* your Microsoft 365 connection — **no app registration, no proxy, no IT ticket.**
Let it fetch your week and paste the result in:

1. In your agent, run this prompt:

   ```
   You have the Work IQ MCP connected. Build my "Burn Rate" week:
   1. Use Work IQ to list my calendar meetings from 14 days ago through 14 days from now.
   2. For each meeting, get its attendees and each attendee's job title
      (use Work IQ's people / org context). Use "" if a title is unknown.
   3. Print ONLY a JSON array (no prose, no code fences) in exactly this shape:

   [
     {
       "subject": "Weekly Staff Sync",
       "start": "2026-06-09T09:00",
       "end":   "2026-06-09T10:00",
       "recurring": true,
       "attendees": [
         { "name": "Dana Wu",  "title": "Principal Product Manager" },
         { "name": "Sam Ortiz", "title": "Engineering Manager" }
       ]
     }
   ]

   Rules: local ISO times (no timezone suffix is fine); "recurring": true for recurring
   meetings; include every attendee with their best-known title. Output the JSON array only.
   ```

2. Open Burn Rate → click the **Import your week** pill (top-right) → **Use your Work IQ
   agent** → paste the JSON → **Load my week.**

Your real meetings, costed, with the share card. The data stays in your browser
(`localStorage`) — nothing is uploaded anywhere.

## Go live automatically (one-time setup)

Demo mode needs nothing. To cost **real** calendars for your team:

1. **Register an Entra app** (Azure portal → *App registrations* → *New*):
   - Platform: **Single-page application**
   - Redirect URIs: your Pages URL (e.g. `https://andrey-esipov.github.io/meeting-cost-calculator/`) and `http://localhost:8899/` for local dev.
   - Note the **Application (client) ID** and your **tenant ID**.
2. **API permissions** (delegated), then **Grant admin consent**:
   - Microsoft Graph: `User.Read`, `Calendars.Read`, `User.ReadBasic.All`
   - Work IQ: `WorkIQAgent.Ask` (search *"Work IQ"* under *APIs my organization uses*, or add it in the manifest: resource `api://workiq.svc.cloud.microsoft`).
3. **Deploy the Work IQ proxy** — see [`proxy/README.md`](proxy/README.md) (~5 min on Azure Functions).
4. **Fill in `js/config.js`**:
   ```js
   msal:   { clientId: "<your client id>", tenantId: "<your tenant id>", ... }
   workIq: { proxyUrl: "https://<your-proxy>/api/workiq", ... }
   ```
5. Push. Now every colleague just clicks **Sign in with Microsoft** — nothing to set up on their end.

Requires Microsoft 365 Copilot + Work IQ enabled in your tenant (for the insight layer).
The cost numbers work for everyone regardless.

## Local dev

```bash
python3 -m http.server 8899   # then open http://127.0.0.1:8899/
```

## Notes

Salaries are **estimates** mapped from public Microsoft levels (levels.fyi), not anyone's
real pay. Costs are directional. Built for awareness and a laugh — **not payroll.** 🙂

## Tech

HTML · CSS · vanilla JS · MSAL.js · Microsoft Graph · Work IQ A2A API · Azure Functions (proxy)

## License

MIT
