# Daily Workout Randomizer

A tiny, dependency-free single-page web app that picks one random exercise for
each workout group (Arms, Legs, Core, Hernia, Cardio). Re-roll everything or any
single group, and your picks are saved on the device between visits.

- No build step, no frameworks, no back end.
- Works offline after first load; selections persist in `localStorage`.
- Mobile-first layout.

## Project layout

```
index.html            # page shell
styles.css            # mobile-first styles
src/
  data.js             # the workout lists (single source of truth)
  selection.js        # pure random-selection logic
  reconcile.js        # merge saved state with current config
  storage.js          # localStorage load/save (never throws)
  app.js              # UI wiring
tests/                # node --test unit tests for the pure logic
deploy/               # S3 deployment script + bucket policy
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

## Deploy to AWS S3

See `specs/001-workout-randomizer/contracts/deployment-contract.md`. Quick path:

```bash
export BUCKET=your-bucket-name
export REGION=us-east-1
# first time: uncomment the one-time setup block in deploy/deploy.sh
deploy/deploy.sh
```

The app is then reachable at
`http://your-bucket-name.s3-website-us-east-1.amazonaws.com`.
