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

## Connect your real calendar — one click for the whole team (~10 min, once)

Demo mode needs nothing. To switch on the **"Sign in with Microsoft"** button so every
colleague sees their *own* real week, do this **once** — no proxy, no admin consent, no IT ticket:

1. **Register an Entra app** — [Azure portal](https://portal.azure.com) → *App registrations* → *New registration*:
   - Name: `Burn Rate`
   - Supported account types: **Accounts in this organizational directory only**
   - **Redirect URI**: platform **Single-page application (SPA)**, value `https://andrey-esipov.github.io/meeting-cost-calculator/` (add `http://localhost:8899/` if you run it locally)
   - Register, then copy the **Application (client) ID**.
2. **Add Graph permissions** — *API permissions* → *Microsoft Graph* → *Delegated* →
   `User.Read`, `Calendars.Read`, `People.Read`. These are **user-consentable** — each
   colleague approves them on their first sign-in. **No "Grant admin consent" needed.**
3. **Turn it on** — open Burn Rate → the **Import your week** pill → **Setup (one-time, admin)** →
   paste the **Client ID** (leave Tenant as `organizations`) → **Save & reload.**
   (Or hardcode it in `js/config.js` and push — same effect.)

Done. The pill becomes **Sign in with Microsoft** for everyone. One click → their real
calendar loads, attendee titles resolve via `/me/people`, the dashboard fills in. Tokens
and data stay in the browser (MSAL `localStorage`); nothing hits a server you run.

**Optional — live Work IQ narrative.** The "read your week" panel runs on a local estimate
by default. To have it *written by Work IQ* instead, deploy the ~30-line relay in
[`proxy/`](proxy/README.md) and paste its URL in the same Setup box (needs M365 Copilot + Work IQ).
Everything else works without it.

**No Azure access?** Colleagues can still use it with zero setup via their Work IQ agent —
see the section above.

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
