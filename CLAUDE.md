# CLAUDE.md

Guidance for working in this repo.

## What this is
Two static, single-page furnace-program calculators for two different machines. Each
generates the controller's input table client-side; both share the same Liquid-Glass
styling and the same optional **"email me when the run is done"** feature (two Vercel
serverless functions plus Upstash QStash). The pages are deliberately **not** linked to
each other — each has its own printed QR code and targets a different furnace.

- **`index.html` (`/`) — MTI furnace.** Controller takes alternating `Ci / Ti`
  setpoint/**duration** pairs, unlimited segments. Fixed rules: max 1600 °C, 5 °C/min
  ramp/drop, preheat holds at 300/800/1200 °C (20 min each), programmed cool floor at
  500 °C then natural cooling (`T = -121` end marker).
- **`lindberg.html` (`/lindberg`) — Thermo Scientific Lindberg/Blue M, Eurotherm 3216C.**
  The 3216C programmer is **8 segments = exactly 4 ramp/dwell pairs**: each pair is
  `TSP.n` (target setpoint) + `RMP.n` (ramp **rate**, not time; `OFF` = step) + `DWEL.n`
  (dwell, `h:mm`). Program setup also emits `TM.CFG=PROG`, `TM.RES`, `THRES` (holdback),
  `END.T` (end behavior). Hard-coded constants: max 1100 °C, ramp ≤ 10 °C/min,
  `TSP.1 = 25 °C` room-temp start with `RMP.1 = 10.0`, Level-2 passcode 25. Pair 1 =
  room-temp purge, pair 2 = target + hold, up to 2 optional extra steps (pairs 3–4);
  unused pairs follow the manual convention `RMP=OFF`, `TSP=previous`. The program shape
  follows the furnace's printed operating card.

## Key files
- `index.html` — the MTI calculator: inputs, `Ci/Ti` table generation, UI. No build step,
  no framework.
- `lindberg.html` — the Lindberg/Blue M (3216C) calculator: ramp/dwell table generation
  (`buildProgram()`), optional extra-step builder, same run/email flow. No build step.
  Reuses `/api/schedule` unchanged (`maxTemp` = target, `holdTime` = main DWEL minutes).
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
- Furnace program constants are hard-coded to the physical hardware — changing them
  changes real furnace behaviour. `index.html`: max temp, ramp rate, preheat holds, cool
  floor. `lindberg.html`: `MAX_TEMP` 1100, `MAX_RATE_CMIN` 10, `START_TEMP` 25,
  `RMP_FIRST` 10.0, `PAIRS` 4 — these match the Lindberg/Blue M operating card.
- The two calculators must stay **unlinked** (separate machines, separate QR codes). Don't
  add cross-navigation between `index.html` and `lindberg.html`.
