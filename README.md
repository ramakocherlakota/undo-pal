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
.github/workflows/    # CI: deploy to S3 on push to main
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

`favicon.svg` is the master: the 🏋️ weightlifter from
[Twemoji](https://github.com/jdecked/twemoji) (`1f3cb.svg`), graphics by Twitter,
Inc and other contributors, licensed
[CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).

The PNGs are rasterized from it with headless Chrome (requires Google Chrome and
ImageMagick):

```bash
bash deploy/make-icons.sh
```

The tab favicon stays transparent and full bleed; the home-screen icons are
flattened onto the `#4f46e5` tile, since iOS and Android composite them over
black or over wallpaper.

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

## Automatic deploys (GitHub Actions)

`.github/workflows/deploy.yml` runs on every push to `main` (and on manual
`workflow_dispatch`). It runs `npm test` first, then assumes an AWS role via
GitHub's OIDC provider — no long-lived access keys — and runs the same
`deploy/deploy.sh` script.

The deploy job runs in the `production` GitHub environment. **That choice
determines the OIDC subject claim:** a job that references an environment gets
`sub = repo:OWNER/REPO:environment:production`, *not* the branch-based
`...:ref:refs/heads/main`. The trust policy in
`deploy/github-oidc-trust-policy.json` matches the environment form. If you ever
remove the `environment:` block from the workflow, the trust policy has to change
to the `ref:refs/heads/main` form to match.

One-time AWS + GitHub setup:

1. **Add GitHub as an OIDC identity provider** in the AWS account (once per
   account):

   ```bash
   aws iam create-open-id-connect-provider \
     --url https://token.actions.githubusercontent.com \
     --client-id-list sts.amazonaws.com
   ```

2. **Create the deploy role** trusting only this repo's `production`
   environment. Fill in your account ID, then create the role and attach the S3
   policy:

   ```bash
   ACCOUNT_ID=123456789012
   BUCKET=undo-pal.rkocherl.net

   sed "s/ACCOUNT_ID/${ACCOUNT_ID}/g" deploy/github-oidc-trust-policy.json > /tmp/trust.json
   aws iam create-role --role-name undo-pal-gha-deploy \
     --assume-role-policy-document file:///tmp/trust.json

   sed "s/BUCKET_NAME/${BUCKET}/g" deploy/github-deploy-policy.json > /tmp/deploy-policy.json
   aws iam put-role-policy --role-name undo-pal-gha-deploy \
     --policy-name undo-pal-s3-deploy --policy-document file:///tmp/deploy-policy.json
   ```

   To repair the trust policy on a role that already exists, use the same
   `/tmp/trust.json` with:

   ```bash
   aws iam update-assume-role-policy --role-name undo-pal-gha-deploy \
     --policy-document file:///tmp/trust.json
   ```

3. **Add the role ARN as a repository secret** named `AWS_ROLE_ARN`
   (Settings → Secrets and variables → Actions). It must be the **full ARN**,
   not the role name — `arn:aws:iam::123456789012:role/undo-pal-gha-deploy`.
   A bare role name fails with *"Source Account ID is needed if the Role Name is
   provided and not the Role Arn."*

You can also add a required reviewer to the `production` environment if you ever
want deploys gated on approval.

### Troubleshooting OIDC

*"Could not assume role with OIDC: Not authorized to perform
sts:AssumeRoleWithWebIdentity"* means the role's trust policy doesn't match the
token's claims. The workflow has a step that runs only on that failure and
prints the actual `sub`/`aud`/`repository`/`ref`/`environment` claims (never the
token) — copy the printed `sub` into the trust policy's `StringLike` condition.

Repositories created after 2026-07-15 may emit an immutable subject claim that
embeds numeric org and repo IDs
(`repo:owner@<ORG_ID>/repo@<REPO_ID>:environment:production`). The shipped trust
policy lists patterns for both the plain and immutable forms, so either matches.
