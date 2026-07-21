---
description: "Task list for Friendly Address & App Icon implementation"
---

# Tasks: Friendly Address & App Icon

**Input**: Design documents from `/specs/002-custom-domain-icon/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No automated tests. This feature adds AWS infrastructure (DNS + S3) and static icon assets with **no application logic**, so validation is manual via quickstart.md (dig/curl checks + real-browser/device icon checks). This matches plan.md (Testing = manual/quickstart).

**Organization**: Grouped by user story. US1 (friendly address, P1) and US2 (app icon, P2) are independent and can be implemented and verified separately.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files/resources, no dependency on an incomplete task)
- **[Story]**: US1 = friendly address, US2 = app icon
- Exact file paths / AWS resources are named in each task

## Path Conventions

Repo root holds the site (`index.html`, icon assets, `site.webmanifest`); `deploy/` holds infra scripts/config. AWS: Route53 zone `rkocherl.net` (`ZDAFGNLUYZ4PV`), S3 us-east-1.

---

## Phase 1: Setup (Shared)

**Purpose**: Confirm tooling and access before making changes

- [X] T001 Verify prerequisites: `aws sts get-caller-identity` succeeds; Route53 zone `ZDAFGNLUYZ4PV` is listable; S3 write access in us-east-1; and `magick` (ImageMagick) is on PATH. (Pre-flight per contracts/; abort if any is missing.)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: None required — US1 (DNS/hosting) and US2 (icon assets) share no blocking code. Proceed directly to the user stories.

---

## Phase 3: User Story 1 - Open the app from a memorable address (Priority: P1) 🎯 MVP

**Goal**: The app is reachable at `http://undo-pal.rkocherl.net`; the old S3 endpoint redirects there; no other `rkocherl.net` records are disturbed.

**Independent Test**: `curl -sI http://undo-pal.rkocherl.net/` returns 200 + `text/html` and the app loads in a browser; the old endpoint 301-redirects to the new host (quickstart Part B).

- [X] T002 [P] [US1] Create `deploy/dns-record.json` — a Route53 change-batch with a single `UPSERT` alias `A` record for `undo-pal.rkocherl.net` → `s3-website-us-east-1.amazonaws.com` (AliasTarget HostedZoneId `Z3AQBSTGFYJSTF`, EvaluateTargetHealth false), per contracts/dns-hosting-contract.md §2.
- [X] T003 [P] [US1] Create `deploy/old-bucket-redirect.json` — `{ "RedirectAllRequestsTo": { "HostName": "undo-pal.rkocherl.net", "Protocol": "http" } }`, per contracts/dns-hosting-contract.md §3.
- [X] T004 [P] [US1] Update `deploy/deploy.sh` to target bucket `undo-pal.rkocherl.net` and additionally `--include` `favicon.svg`, `*.png`, and `site.webmanifest`, plus a follow-up `aws s3 cp site.webmanifest ... --content-type application/manifest+json --metadata-directive REPLACE`, per contracts/dns-hosting-contract.md §4.
- [X] T005 [P] [US1] Provision the new content bucket `undo-pal.rkocherl.net` (us-east-1): `aws s3 mb`, `aws s3 website` (index/error = index.html), `aws s3api put-public-access-block` (all false), and apply the public-read policy from `deploy/bucket-policy.json` (with `BUCKET_NAME` substituted), per contracts/dns-hosting-contract.md §1. Bucket name MUST equal the FQDN.
- [X] T006 [US1] Deploy site content to `s3://undo-pal.rkocherl.net` by running `deploy/deploy.sh`; pre-flight check the raw website endpoint `http://undo-pal.rkocherl.net.s3-website-us-east-1.amazonaws.com/` returns 200 before DNS exists. (Depends on T004, T005.)
- [X] T007 [US1] Apply the DNS alias with `aws route53 change-resource-record-sets --hosted-zone-id ZDAFGNLUYZ4PV --change-batch file://deploy/dns-record.json`; then confirm the change-batch touched only `undo-pal.rkocherl.net` and existing records (`dict`, ACM CNAMEs, NS/SOA) remain (FR-005). (Depends on T002, T006.)
- [X] T008 [US1] Configure the old bucket to redirect: `aws s3api put-bucket-website --bucket workout-randomizer-rama-app --website-configuration file://deploy/old-bucket-redirect.json` (FR-006). (Depends on T003.)
- [X] T009 [US1] Verify the friendly address: `dig +short undo-pal.rkocherl.net` resolves; `curl -sI http://undo-pal.rkocherl.net/` → 200 text/html and `/src/app.js` → 200 text/javascript; old endpoint → 301 to `http://undo-pal.rkocherl.net/` (quickstart Part B steps 7–8). (Depends on T007, T008.)

**Checkpoint**: MVP — the app is live at the friendly address and old links redirect. Independently demoable.

---

## Phase 4: User Story 2 - Recognize the app by its icon (Priority: P2)

**Goal**: The app shows a weightlifting icon in the browser tab and on phone home screens.

**Independent Test**: Load the app locally; the tab shows the weightlifting icon (not the default), legible at 16–32px; `favicon.svg` serves as `image/svg+xml` and `site.webmanifest` as `application/manifest+json` (quickstart Part A).

- [X] T010 [P] [US2] Author `favicon.svg` at repo root — an original bold barbell-press glyph (white/light figure on an accent `#4f46e5` rounded-square tile, ~10% padding), legible at small sizes and on light/dark backgrounds, per contracts/icon-contract.md artwork spec (FR-007, FR-009, FR-010).
- [X] T011 [P] [US2] Create `site.webmanifest` at repo root (name "Daily Workout Randomizer", short_name, theme_color `#4f46e5`, background_color `#0f172a`, icons 192 + 512 with `purpose: "any maskable"`), per contracts/icon-contract.md schema.
- [X] T012 [P] [US2] Create `deploy/make-icons.sh` — rasterize `favicon.svg` to `favicon-32.png` (32), `apple-touch-icon.png` (180), `icon-192.png` (192), `icon-512.png` (512) via `magick -background none ... -resize`, per contracts/icon-contract.md.
- [X] T013 [US2] Run `bash deploy/make-icons.sh` to generate the four PNGs at repo root; verify dimensions with `magick identify` / `sips`. (Depends on T010, T012.)
- [X] T014 [US2] Edit `index.html` `<head>`: add `<link rel="icon" href="favicon.svg" type="image/svg+xml">`, `<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png">`, `<link rel="apple-touch-icon" href="apple-touch-icon.png">`, `<link rel="manifest" href="site.webmanifest">`; reconcile `theme-color` to a single `#4f46e5` (remove the existing `#0f172a` duplicate), per contracts/icon-contract.md.
- [X] T015 [US2] Local preview validation: `python3 -m http.server 8000`; confirm the tab shows the weightlifting icon, all five icon files + manifest return 200 with correct content types, and the icon is identifiable at 16–32px on light and dark tab backgrounds (quickstart Part A). (Depends on T011, T013, T014.)

**Checkpoint**: US1 + US2 both complete — friendly address serves the app with a recognizable icon.

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Get the icon onto the live site and validate on real devices

- [X] T016 Redeploy to `s3://undo-pal.rkocherl.net` via `deploy/deploy.sh` so the live site includes the icon assets + manifest with correct content types; re-run quickstart Part B curls (favicon.svg → image/svg+xml, site.webmanifest → application/manifest+json). (Depends on US1 deployed + US2 assets: T009, T013, T014.)
- [ ] T017 Real-device checks (quickstart Part C): open `http://undo-pal.rkocherl.net` on a phone (app works), iOS "Add to Home Screen" shows the apple-touch icon, Android install uses the manifest icons (FR-008).
- [X] T018 [P] Update `README.md`: document the friendly URL `http://undo-pal.rkocherl.net`, that the canonical deploy bucket is now `undo-pal.rkocherl.net` (old bucket redirects), and note the icon assets + `make-icons.sh`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: none.
- **US1 (Phase 3)** and **US2 (Phase 4)**: both depend only on Setup and are independent of each other — they can be done in either order or in parallel by different people.
- **Polish (Phase 5)**: T016 depends on both US1 (deployed) and US2 (assets built); T017 depends on T016; T018 can run any time after both stories.

### Within US1

- Config files (T002, T003, T004) and bucket provisioning (T005) are parallel.
- Deploy (T006) needs T004 + T005 → DNS alias (T007) needs T006 → verify (T009) needs T007 + redirect (T008).

### Within US2

- `favicon.svg` (T010), `site.webmanifest` (T011), and `make-icons.sh` (T012) are parallel.
- Generate PNGs (T013) needs T010 + T012 → wire `index.html` (T014) → preview (T015).

### Parallel Opportunities

- US1 config authoring: T002, T003, T004, T005 together.
- US2 authoring: T010, T011, T012 together.
- Whole stories: one person on US1, another on US2.

---

## Parallel Example: US1 setup

```bash
Task: "Create deploy/dns-record.json"            # T002
Task: "Create deploy/old-bucket-redirect.json"   # T003
Task: "Update deploy/deploy.sh"                   # T004
Task: "Provision bucket undo-pal.rkocherl.net"    # T005
```

## Parallel Example: US2 authoring

```bash
Task: "Author favicon.svg"          # T010
Task: "Create site.webmanifest"     # T011
Task: "Create deploy/make-icons.sh" # T012
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. US1 (T002–T009).
3. **STOP and VALIDATE**: `http://undo-pal.rkocherl.net` loads the app; old endpoint redirects.
4. Ship — the friendly address is the headline value and stands alone.

### Incremental Delivery

1. US1 → friendly address live (MVP).
2. US2 → icon built and previewed locally.
3. Polish → redeploy so the live site carries the icon; verify on a phone.

### Total: 18 tasks

- Setup: 1 (T001)
- US1 (P1): 8 (T002–T009)
- US2 (P2): 6 (T010–T015)
- Polish: 3 (T016–T018)

---

## Notes

- [P] = different files/resources, no dependency on an incomplete task.
- If US2 is done before US1's deploy (T006), that deploy already carries the icons and T016 is a no-op re-verify.
- All AWS mutations are idempotent (UPSERT / re-runnable) per the contracts; rollback steps are in contracts/dns-hosting-contract.md.
- HTTP only by design — a browser "Not secure" label is expected, not a defect.
