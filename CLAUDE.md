# CLAUDE.md

Guidance for working in this repo.

## What this is
A static single-page calculator that generates a tube-furnace setpoint table
(`Ci / Ti` temperature/time pairs) from a target max temp and hold time. Fixed
program rules: max 1600 °C, 5 °C/min ramp/drop, preheat holds at 300/800/1200 °C
(20 min each), programmed cool floor at 500 °C then natural cooling (`C = -127`
marker). All the table math lives client-side in `index.html`.

On top of the static page there's an optional **"email me when the run is done"**
feature backed by two Vercel serverless functions plus Upstash QStash.

## Key files
- `index.html` — the entire app: inputs, setpoint-table generation, UI. ~660 lines,
  no build step, no framework.
- `api/schedule.js` — `POST /api/schedule`: validates email + duration, schedules a
  delayed QStash job (`delaySeconds = totalMinutes * 60`) that will call `/api/notify`.
  `{ test: true }` fires immediately with no duration check.
- `api/notify.js` — QStash webhook target. Verifies the `upstash-signature` (raw body,
  `bodyParser` disabled), then sends the completion email via `nodemailer`.
- `package.json` — only deps are `@upstash/qstash` and `nodemailer` (used by the API).

## Commands
```bash
# local preview (static — no server needed, but this avoids file:// quirks)
python3 -m http.server 8000      # then open http://localhost:8000

# deploy: static site + serverless API, zero-config on Vercel
vercel deploy
```

## Conventions / gotchas
- **Env vars (Vercel)**: `QSTASH_TOKEN` (schedule), `QSTASH_CURRENT_SIGNING_KEY` /
  `QSTASH_NEXT_SIGNING_KEY` (notify signature verification), plus the SMTP settings
  nodemailer reads. The reminder flow is dead without these.
- `api/notify.js` disables the body parser on purpose — QStash signature verification
  needs the **raw** request body. Don't add JSON parsing back.
- Furnace program constants (max temp, ramp rate, preheat holds, cool floor) are
  hard-coded to the physical furnace — changing them changes real hardware behaviour.
