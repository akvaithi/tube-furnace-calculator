# Tube Furnace Program Calculator

Static single-page calculator that generates a setpoint table (C/T pairs) for a tube furnace program.

## Specs

- Max temp: 1600 °C
- Ramp/drop rate: 5 °C/min
- Required preheat holds: 300, 800, 1200 °C (20 min each)
- Programmed cool floor: 500 °C → then natural cooling (C = -127 marker)

## Inputs

- Target max temperature (°C)
- Hold time at max (min)

## Output

Table of `Ci / Ti` values, where `C` is temperature (°C) and `T` is time in minutes to reach / hold at that point.

## Local preview

Open `index.html` directly in a browser, or serve it:

```
python3 -m http.server 8000
```

## Deploy

Static site — deploy to Vercel with zero config.
