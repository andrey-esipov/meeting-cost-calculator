# 💸 Meeting Cost Calculator

A sleek single-page app to visualize the real-time cost of meetings based on team roles and salaries.

![Screenshot placeholder](./assets/screenshot.png)

## Why I built this
Product teams often underestimate the true cost of recurring meetings. I wanted a fast, visual way to highlight time spend and make meeting tradeoffs visible. The goal is to help PMs and engineering leaders optimize focus time without sacrificing alignment.

## Features
- Live meeting cost ticker with smooth animations
- Role-based salary presets and flexible attendee inputs
- Per-minute, per-hour, and planned total cost summaries
- D3.js donut chart for weekly meeting cost breakdown
- D3.js sparkline for cost trends
- Start/stop meeting timer with live cost accumulation
- Copyable summary to clipboard
- Dark/light theme toggle
- LocalStorage for settings persistence

## How to use
1. Open `index.html` in your browser
2. Set the planned duration and attendee roles
3. Click **Start Meeting** to track real-time cost
4. Use **Copy Summary** to share the results

## Tech stack
- HTML, CSS, JavaScript
- D3.js for visualizations
- LocalStorage

## License
MIT
