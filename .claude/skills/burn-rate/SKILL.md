---
name: burn-rate
description: Cost your real meetings with Burn Rate. Use when the user runs /burn-rate or asks "what do my meetings cost", "cost my week/calendar", or "how expensive are my meetings". Pulls the user's calendar from the Work IQ MCP, opens the Burn Rate dashboard pre-filled with their costed week, and prints a quick summary. Requires a Work IQ MCP tool to be connected.
---

# /burn-rate — cost your week

Turn the user's real calendar into a costed **Burn Rate** dashboard. You fetch their week
through the **Work IQ MCP** and hand it to the hosted app, which does the cost math + UI.
Run the whole thing end to end; the user should just land on their dashboard.

## 1. Confirm Work IQ is available
You need a Work IQ MCP tool (e.g. `ask_work_iq`, or the **Work IQ Calendar / People** tools).
If none is connected, tell the user to add the Work IQ MCP to this agent and **stop** —
don't fabricate meetings.

## 2. Pull the week
Use Work IQ to get the user's calendar meetings from **14 days ago through 14 days from now**.
For each meeting, get its **attendees** and each attendee's **job title** (Work IQ people /
org context; use `""` when a title is unknown).

## 3. Build the data
Produce a COMPACT JSON array — one object per meeting — in EXACTLY this shape, and write it
to `/tmp/burn-rate.json`:

```json
[
  { "subject": "Weekly Staff Sync", "start": "2026-06-09T09:00", "end": "2026-06-09T10:00",
    "recurring": true,
    "attendees": [ { "name": "Dana Wu", "title": "Principal Product Manager" },
                   { "name": "Sam Ortiz", "title": "Engineering Manager" } ] }
]
```
Rules: local ISO times (no timezone suffix); `"recurring": true` for recurring meetings;
include every attendee with their best-known title.

## 4. Open the dashboard
Base64-encode the JSON as UTF-8 with no line wraps and open the app with it in the URL hash
(the app decodes the hash, costs the week, and shows the leaderboard + share card):

```bash
B64=$(base64 < /tmp/burn-rate.json | tr -d '\n')
URL="https://andrey-esipov.github.io/meeting-cost-calculator/#data=$B64"
open "$URL" 2>/dev/null || xdg-open "$URL" 2>/dev/null || start "" "$URL" 2>/dev/null || echo "$URL"
```

## 5. Summarize
Tell the user, in 1–2 lines: how many meetings this week and that their dashboard is opening
(e.g. "Opening Burn Rate — 23 meetings on your calendar this week 🔥"). If `open` wasn't
available, give them the URL to click.

## Notes
- Costs are estimates from public Microsoft levels (the app maps titles → comp bands).
- Privacy: the week is passed only in the URL **hash** (never sent to a server) and the app
  clears it from the URL on load. Nothing is uploaded.
- No app registration, Service Tree, or admin consent — this rides the Work IQ MCP the user
  already has.
