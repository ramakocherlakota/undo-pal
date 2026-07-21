# Implementation Plan: Friendly Address & App Icon

**Branch**: `002-custom-domain-icon` | **Date**: 2026-07-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-custom-domain-icon/spec.md`

## Summary

Two independent additions to the already-deployed Daily Workout Randomizer:

1. **Friendly address** — serve the app at `http://undo-pal.rkocherl.net` via a Route53 record in the existing `rkocherl.net` hosted zone. Because an S3 website endpoint selects the bucket by the request's Host header, the app is deployed to a **new bucket named exactly `undo-pal.rkocherl.net`**; a Route53 **alias A record** points the subdomain at the us-east-1 S3 website endpoint. The existing `workout-randomizer-rama-app` bucket is reconfigured to **redirect** all requests to the new address, so previously shared links keep working with a single source of content. HTTP only (no TLS/CloudFront) per the spec.

2. **Weightlifting app icon** — author one master `favicon.svg` (a figure pressing a barbell overhead), rasterize it to the PNG sizes browsers and phone home screens need, add a small web manifest, and wire the `<link>` tags into `index.html`. No application logic changes.

## Technical Context

**Languages/Assets**: HTML (`<link>` tags in `index.html`), SVG (icon master), PNG (rasterized icons), JSON (web manifest, Route53 change-batch, S3 website config), shell (deploy/DNS scripts). No changes to the app's JS.

**Primary Dependencies**: AWS CLI v2 (Route53 + S3); ImageMagick (`magick`) for SVG→PNG rasterization (confirmed installed). No runtime dependencies added to the app.

**Storage**: DNS records in Route53 hosted zone `rkocherl.net` (`ZDAFGNLUYZ4PV`); static objects in a new S3 bucket `undo-pal.rkocherl.net` (us-east-1). No databases.

**Testing**: Manual/quickstart validation — DNS resolution (`dig`), HTTP fetch of the custom domain (`curl` status + content-type), redirect check on the old endpoint, and a real-browser visual check of the tab icon + iOS/Android home-screen icon. No unit tests (no logic).

**Target Platform**: Mobile and desktop browsers; iOS "Add to Home Screen" (apple-touch-icon) and Android/Chrome installable (web manifest).

**Performance Goals**: Custom domain resolves and loads the app within a few seconds after DNS propagation; icon visible in the tab within 1s of load.

**Constraints**: HTTP only (browsers will show "Not secure" — accepted per spec). Must not disturb existing `rkocherl.net` records (`dict`, ACM-validation CNAMEs, apex NS/SOA). Existing S3 endpoint must keep working (via redirect). Icon must read at 16–32px and on light/dark tab backgrounds.

**Scale/Scope**: Single user/owner. One subdomain, one new bucket, ~5 icon files + 1 manifest, a handful of `<link>` tags.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is an unpopulated template (no ratified principles). Evaluated against general best-practice gates:

| Gate | Status | Notes |
|------|--------|-------|
| Simplicity / YAGNI | ✅ Pass | Plain DNS + S3 website (no CloudFront/TLS), single master SVG rasterized to the minimum needed sizes. |
| No unnecessary dependencies | ✅ Pass | No runtime deps added; tooling limited to AWS CLI + ImageMagick already present. |
| No disruption / least privilege | ✅ Pass | New subdomain record only; existing records untouched; old bucket redirect preserves prior links (FR-005, FR-006). |
| Reversibility | ✅ Pass | DNS record and buckets are independently removable; icon is additive markup. |

**Result**: PASS. Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/002-custom-domain-icon/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (entities: DNS record set + icon asset set)
├── quickstart.md        # Phase 1 output (validation guide)
├── contracts/           # Phase 1 output
│   ├── dns-hosting-contract.md   # Route53 record + S3 bucket/website/redirect config
│   └── icon-contract.md          # Required icon files, sizes, <link> tags, manifest schema
└── tasks.md             # /speckit-tasks output (NOT created here)
```

### Source Code (repository root)

```text
index.html               # EDIT: add favicon/apple-touch/manifest <link> tags (+ theme-color)
favicon.svg              # NEW: master weightlifting icon (scalable, light/dark aware)
favicon-32.png           # NEW: rasterized tab fallback (32x32)
apple-touch-icon.png     # NEW: iOS home-screen icon (180x180)
icon-192.png             # NEW: manifest/Android icon (192x192)
icon-512.png             # NEW: manifest/Android icon (512x512, maskable-safe padding)
site.webmanifest         # NEW: web app manifest (name, theme, icons)

deploy/
├── make-icons.sh        # NEW: rasterize favicon.svg -> the PNG sizes via ImageMagick
├── deploy.sh            # EDIT: target the undo-pal.rkocherl.net bucket; include icons + manifest; set content-types
├── dns-record.json      # NEW: Route53 change-batch (UPSERT alias A record)
├── old-bucket-redirect.json  # NEW: S3 website redirect config for the old bucket
└── bucket-policy.json   # REUSE: public-read policy template (applied to the new bucket)
```

**Structure Decision**: Icon assets and the manifest live at the **repository root** next to `index.html` — this matches favicon conventions, keeps `<link href>` paths simple, and lets browsers/crawlers find `/favicon.svg` and `/apple-touch-icon.png` by convention. They deploy as ordinary S3 objects with the rest of the site. Infra artifacts (DNS change-batch, redirect config, icon build script) live under `deploy/`, excluded from the site sync. The canonical content bucket becomes `undo-pal.rkocherl.net`; the old bucket serves only a redirect.

## Complexity Tracking

No constitution violations. Section intentionally empty.
