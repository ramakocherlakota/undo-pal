# Deployment Contract: Daily Workout Randomizer

**Feature**: 001-workout-randomizer

Defines how the static site is deployed to AWS S3 static website hosting (FR-014, Decision 7). The deploy is a plain file sync — there is no build step.

## Prerequisites

- AWS CLI v2 installed and configured (`aws configure`) with credentials that can manage the target bucket.
- An S3 bucket name (globally unique), e.g. `daily-workout-randomizer-<suffix>`, in a chosen region.

## Deployable artifacts (what gets synced)

Everything needed to run the app, and nothing else:

```text
index.html
styles.css
src/**            (data.js, selection.js, storage.js, reconcile.js, app.js)
```

**Excluded from sync**: `specs/`, `tests/`, `deploy/`, `.git/`, dotfiles, and any Markdown/docs. The deploy script uses explicit `--exclude`/`--include` rules so only web assets are uploaded.

## Bucket configuration

1. **Create bucket** (once):
   ```bash
   aws s3 mb s3://$BUCKET --region $REGION
   ```
2. **Enable static website hosting** with `index.html` as both index and error document (SPA-friendly; the app is a single page):
   ```bash
   aws s3 website s3://$BUCKET --index-document index.html --error-document index.html
   ```
3. **Allow public read** for website access. Disable "Block Public Access" for the bucket, then apply a public-read bucket policy (`deploy/bucket-policy.json`):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadForWebsite",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::BUCKET_NAME/*"
       }
     ]
   }
   ```
   ```bash
   aws s3api put-bucket-policy --bucket $BUCKET --policy file://deploy/bucket-policy.json
   ```

## Deploy command (repeatable)

```bash
aws s3 sync . s3://$BUCKET \
  --exclude "*" \
  --include "index.html" \
  --include "styles.css" \
  --include "src/*" \
  --delete
```

- `--delete` keeps the bucket in sync with the working tree (removes deleted files).
- Content types are inferred by the CLI (`.html`, `.css`, `.js`). If any `.js` is served with the wrong MIME type, set `--content-type` on a targeted second sync or configure metadata — ES modules require a JavaScript MIME type to load.

## Verification (acceptance for FR-014 / SC-007)

- Website endpoint: `http://$BUCKET.s3-website-$REGION.amazonaws.com`
- Open it on a phone browser; confirm a complete routine renders and re-roll/persist work with no back-end running.

## Optional production enhancement (out of scope for v1)

S3 website endpoints serve HTTP only. For HTTPS and a custom domain, front the bucket with CloudFront + ACM certificate + Route 53. Documented here for awareness; not required by the v1 spec, which asks only for "an S3 bucket configured for hosting it."

## Contract checklist

- [ ] Bucket created and website hosting enabled with `index.html` index document.
- [ ] Public-read policy applied; site reachable at the website endpoint.
- [ ] `aws s3 sync` uploads only web assets (no specs/tests/deploy docs).
- [ ] `.js` files served with a JavaScript MIME type (modules load without console errors).
- [ ] App loads and functions on a phone browser over the endpoint URL.
