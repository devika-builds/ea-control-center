# Executive Assistant Control Center

A portfolio piece demonstrating EA / VA workflow design. Built as a single React component that models what makes executive assistant work actually hard:

- **Blocking dependencies** — you can't send the calendar invites until the CEO approves the times
- **Waiting state** — different from backlog; needs active follow-up, not just parking
- **Time-boxed days** — a 9 AM briefing beats a Friday "high priority"
- **Cascading impact** — one slip slides the whole downstream chain

## What's inside

- `src/ExecutiveAssistantControlCenter.jsx` — the main component, self-contained with inline styles and sample data
- `src/App.jsx` — page wrapper
- `src/main.jsx` — Vite entry

Four tabs: **Today** (timeline + blocking alert), **This Week** (bottleneck detection), **Calendar** (events + available slots), **Notes** (action items linked to tasks).

## Run locally

```bash
npm install
npm run dev
```

## Deploy

Connected to Vercel — any push to `main` auto-deploys.

## Stack

Plain React 18, Vite, inline styles, no component libraries.
