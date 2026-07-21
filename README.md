# Daily Workout Randomizer

A tiny, dependency-free single-page web app that picks one random exercise for
each workout group (Arms, Legs, Core, Hernia, Cardio). Re-roll everything or any
single group, and your picks are saved on the device between visits.

**Live:** http://undo-pal.rkocherl.net

- No build step, no frameworks, no back end.
- Works offline after first load; selections persist in `localStorage`.
- Mobile-first layout, with a weightlifting app icon for the browser tab and home screen.

## Project layout

```
index.html            # page shell (+ favicon / manifest links)
styles.css            # mobile-first styles
favicon.svg           # weightlifting app icon (master; PNGs derive from it)
favicon-32.png apple-touch-icon.png icon-192.png icon-512.png   # rasterized icons
site.webmanifest      # web app manifest (name, theme, icons)
src/
  data.js             # the workout lists (single source of truth)
  selection.js        # pure random-selection logic
  reconcile.js        # merge saved state with current config
  storage.js          # localStorage load/save (never throws)
  app.js              # UI wiring
tests/                # node --test unit tests for the pure logic
deploy/               # S3 deploy + DNS/redirect config + icon build script
specs/                # spec / plan / tasks / contracts (Spec Kit)
```

## Run locally

ES modules must be served over HTTP (not `file://`). Any static server works:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Edit the workouts

Edit `src/data.js` — add/remove categories or exercises. Each category is
`{ id, name, exercises: [...] }`. That is the only file you need to change; the
UI adapts to however many categories you define. The lists are also mirrored in
`specs/001-workout-randomizer/workouts.md`.

## Run the tests

```bash
node --test tests/*.test.js
# or: npm test
```

Covers the random-selection and reconciliation edge cases (empty lists,
single-item lists, avoid-immediate-repeat, config/state drift). Requires
Node.js >= 18.

## Regenerate the icons

The PNG icons are rasterized from `favicon.svg` (requires ImageMagick):

```bash
bash deploy/make-icons.sh
```

## Deploy to AWS S3

The canonical bucket is `undo-pal.rkocherl.net`, served at
**http://undo-pal.rkocherl.net** (Route53 alias → S3 website endpoint, HTTP).
The old `workout-randomizer-rama-app` bucket redirects there.

```bash
deploy/deploy.sh          # defaults to the undo-pal.rkocherl.net bucket
```

DNS and redirect setup are one-time; see
`specs/002-custom-domain-icon/contracts/dns-hosting-contract.md` (and
`specs/001-workout-randomizer/contracts/deployment-contract.md` for the original bucket).
