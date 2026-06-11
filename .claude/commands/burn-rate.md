---
description: Open Burn Rate for my real week (via the Work IQ MCP)
---
You have the **Work IQ MCP** connected. Open my "Burn Rate" dashboard pre-filled with my real week. Do it end to end — I should just land on the page.

1. Use Work IQ to get my calendar meetings from **14 days ago through 14 days from now**, and for each meeting its attendees and each attendee's **job title** (use Work IQ's people / org context; use `""` if a title is unknown).

2. Build a COMPACT JSON array in exactly this shape (no prose, no code fences):

   ```
   [
     { "subject": "Weekly Staff Sync", "start": "2026-06-09T09:00", "end": "2026-06-09T10:00",
       "recurring": true,
       "attendees": [ { "name": "Dana Wu", "title": "Principal Product Manager" },
                      { "name": "Sam Ortiz", "title": "Engineering Manager" } ] }
   ]
   ```
   Local ISO times (no timezone suffix is fine); `"recurring": true` for recurring meetings; include every attendee.

3. Base64-encode that JSON as UTF-8 with **no line wraps**, then open this URL in my default browser:

   `https://andrey-esipov.github.io/meeting-cost-calculator/#data=<BASE64>`

   One-shot example (macOS/Linux), with the JSON in a shell var `$JSON`:

   ```bash
   open "https://andrey-esipov.github.io/meeting-cost-calculator/#data=$(printf %s "$JSON" | base64 | tr -d '\n')"
   # Linux: xdg-open    Windows: start
   ```

That's it — the page reads the hash, costs my week, and shows the leaderboard + share card. Nothing is uploaded; the data only ever lives in my browser.
