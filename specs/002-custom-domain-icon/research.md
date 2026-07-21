# Phase 0 Research: Friendly Address & App Icon

**Feature**: 002-custom-domain-icon
**Date**: 2026-07-20

The spec's one clarification (FR-004) was resolved by the user: subdomain `undo-pal.rkocherl.net`, HTTP only. This document records the technical decisions and the environment facts verified during planning.

## Verified environment facts

- Route53 public hosted zone `rkocherl.net.` exists — ID `ZDAFGNLUYZ4PV`. (A second zone `ramakocherlakota.net.` also exists but is unused here.)
- No existing `undo-pal.rkocherl.net` record — no collision. Existing records (`dict.rkocherl.net` A, ACM-validation CNAMEs, apex NS/SOA) will be left untouched (FR-005).
- The current app bucket `workout-randomizer-rama-app` is in **us-east-1** (`get-bucket-location` → `null` = us-east-1) with website hosting (index/error = `index.html`).
- ImageMagick is installed (`magick`, `convert`); `rsvg-convert`, `inkscape`, `cairosvg` are not. `sips`/`qlmanage` exist but don't rasterize SVG cleanly.

## Decision 1: New bucket named `undo-pal.rkocherl.net` (Host-header requirement)

- **Decision**: Create a new S3 bucket named exactly `undo-pal.rkocherl.net` (us-east-1), enable website hosting, apply the public-read policy, and deploy the app there. This becomes the canonical content bucket.
- **Rationale**: An S3 **website** endpoint selects the target bucket from the request's `Host` header. A request to `undo-pal.rkocherl.net` arrives with `Host: undo-pal.rkocherl.net`, so S3 looks for a bucket of that exact name. Pointing DNS at the existing `workout-randomizer-rama-app` website endpoint would return `NoSuchBucket`/404 because the host doesn't match a bucket. Bucket names can't be changed, so a new, correctly-named bucket is required.
- **Alternatives considered**:
  - *CNAME/alias to the existing bucket's website endpoint*: Fails for the Host-header reason above. Rejected.
  - *Rename the existing bucket*: Not possible in S3. Rejected.
  - *S3 REST (virtual-hosted) endpoint instead of the website endpoint*: Serves objects but has no index-document behavior (`/` wouldn't return `index.html`) and no friendly routing; the website endpoint is the right tool. Rejected.

## Decision 2: Route53 alias A record → S3 website endpoint

- **Decision**: Create an **alias A record** for `undo-pal.rkocherl.net` targeting the us-east-1 S3 website endpoint: `DNSName = s3-website-us-east-1.amazonaws.com`, `HostedZoneId = Z3AQBSTGFYJSTF` (the fixed Route53 zone ID for S3 website endpoints in us-east-1), `EvaluateTargetHealth = false`. Apply via an UPSERT change-batch so re-runs are idempotent.
- **Rationale**: Alias records are free, resolve at the zone apex/subdomain without a CNAME hop, and are the AWS-documented pattern for fronting an S3 website bucket whose name equals the domain. UPSERT makes the operation safe to repeat.
- **Alternatives considered**:
  - *CNAME record to `undo-pal.rkocherl.net.s3-website-us-east-1.amazonaws.com`*: Works too, but alias is cleaner and cheaper and the standard choice. Kept as a documented fallback.

## Decision 3: Old bucket redirects to the new address (link continuity)

- **Decision**: Reconfigure the existing `workout-randomizer-rama-app` bucket's website config to **redirect all requests** to host `undo-pal.rkocherl.net` over HTTP. Its content copy can remain but is no longer canonical.
- **Rationale**: Satisfies FR-006 ("existing endpoint continues to work, or clearly redirects") and keeps a single source of content (deploys go only to the new bucket), avoiding drift between two copies. The old S3 endpoint URL — already referenced in the repo/GitHub — then 301-redirects visitors to the friendly address.
- **Alternatives considered**:
  - *Keep both buckets serving content, deploy to both*: Doubles the deploy target and risks drift. Rejected.
  - *Delete the old bucket*: Breaks previously shared links (violates FR-006). Rejected.

## Decision 4: Icon format set — SVG master + PNG derivatives + web manifest

- **Decision**: Author one master `favicon.svg`. Produce the minimum set that covers tab + phone home screen:
  - `favicon.svg` — modern browser tab (scalable, crisp at any DPI).
  - `favicon-32.png` — fallback tab icon for browsers without SVG-favicon support.
  - `apple-touch-icon.png` (180×180) — **required** for iOS "Add to Home Screen".
  - `icon-192.png`, `icon-512.png` — referenced by the web manifest for Android/Chrome installs.
  - `site.webmanifest` — name, `theme_color`, `background_color`, and the icon list.
- **Rationale**: iOS ignores SVG favicons and manifest icons for home-screen bookmarks — it uses `apple-touch-icon` PNG, so that file is mandatory given the user is on a phone (FR-008). SVG covers modern desktop/Android tabs at all resolutions; the 32px PNG is a small safety net. 192/512 PNGs are the manifest convention for installable icons. This is the standard, minimal, well-supported favicon set.
- **Alternatives considered**:
  - *`favicon.ico` multi-size*: Legacy; SVG + PNG-32 cover the same need more simply. Skipped (optional add-on).
  - *Single SVG only*: Insufficient — iOS home screen and Android manifest need PNGs. Rejected.

## Decision 5: Rasterize with ImageMagick, browser-canvas fallback

- **Decision**: Generate the PNGs from `favicon.svg` with ImageMagick (`magick favicon.svg -background none -resize NxN out.png`) via a small `deploy/make-icons.sh` script. If ImageMagick's SVG rendering is unsatisfactory for the final artwork, fall back to rasterizing via a headless Chrome canvas (already available in this toolchain).
- **Rationale**: ImageMagick is already installed and handles a simple flat icon well; scripting it keeps icon regeneration reproducible from the single SVG source. The browser-canvas path is a reliable, high-fidelity fallback with no new dependency.
- **Alternatives considered**:
  - *Hand-craft each PNG*: Not reproducible; drifts from the SVG source. Rejected.
  - *Add `sharp`/`cairosvg`*: New dependency/install for something ImageMagick already does. Rejected.

## Decision 6: Icon artwork — flat weightlifting glyph, theme-aware

- **Decision**: A simple, bold weightlifting mark: a stick/rounded figure pressing a barbell overhead (or a clean barbell if the figure is illegible at 16px), on a rounded-square background using the app's accent color so it reads on both light and dark tab strips. Keep ~10% safe padding for maskable/Android.
- **Rationale**: FR-009 requires legibility at 16–32px and on light/dark backgrounds. A filled shape on a colored rounded square (rather than a thin outline on transparency) stays visible on any tab color. The barbell-press motif directly matches the user's "somebody lifting a weight" request. Original artwork satisfies FR-010.
- **Alternatives considered**:
  - *Detailed human figure*: Turns to mud at 16px. Rejected in favor of a bold, simplified silhouette.
  - *Transparent-background outline*: Can vanish on same-color tab backgrounds. Rejected in favor of a colored tile.

## Decision 7: Content types on deploy

- **Decision**: Ensure correct `Content-Type` on the new object types: `.svg` → `image/svg+xml`, `.png` → `image/png`, `.webmanifest` → `application/manifest+json`. `aws s3 sync` infers `.svg`/`.png` correctly but may not know `.webmanifest`; set it explicitly (targeted `--content-type` on that file).
- **Rationale**: A wrong manifest MIME type can make browsers ignore it; SVG served as the wrong type won't render as a favicon. Explicit content type avoids silent icon/manifest failures.
- **Alternatives considered**: *Rely entirely on sync inference*: risks the `.webmanifest` type. Rejected.

## Summary of decisions

| Topic | Resolution |
|-------|-----------|
| Where the app lives for the custom domain | New bucket `undo-pal.rkocherl.net` (Host-header rule) |
| DNS | Route53 alias A → `s3-website-us-east-1.amazonaws.com` (zone `Z3AQBSTGFYJSTF`), UPSERT |
| Old endpoint | Redirect-all to `undo-pal.rkocherl.net` (link continuity) |
| Icon files | `favicon.svg` + `favicon-32.png` + `apple-touch-icon.png` (180) + `icon-192/512.png` + `site.webmanifest` |
| Rasterizer | ImageMagick; browser-canvas fallback |
| Artwork | Bold barbell-press glyph on accent rounded tile, theme-safe |
| Deploy | Include new assets; set `.webmanifest` content type explicitly |
