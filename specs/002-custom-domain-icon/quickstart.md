# Quickstart & Validation: Friendly Address & App Icon

**Feature**: 002-custom-domain-icon

Runnable validation that the friendly address and the app icon work end-to-end. References [contracts/](./contracts/) rather than repeating config.

## Prerequisites

- AWS CLI v2 configured with access to the `rkocherl.net` zone (`ZDAFGNLUYZ4PV`) and S3 (already verified in planning).
- ImageMagick (`magick`) for icon rasterization (installed).
- The app repo checked out at root.

## Part A — App icon (do this first; no AWS needed to preview)

1. **Generate icons from the master SVG**:
   ```bash
   bash deploy/make-icons.sh
   ls -la favicon.svg favicon-32.png apple-touch-icon.png icon-192.png icon-512.png site.webmanifest
   ```
   **Expected**: all six files exist; PNG dimensions are 32/180/192/512 (`sips -g pixelWidth -g pixelHeight <file>` or `magick identify <file>`).

2. **Preview locally**:
   ```bash
   python3 -m http.server 8000    # → http://localhost:8000
   ```
   - Browser tab shows the weightlifting icon (not the default).
   - `curl -sI http://localhost:8000/favicon.svg` → `image/svg+xml`; `.../site.webmanifest` → `application/manifest+json`.
   - Shrink the tab / inspect at 16–32px: the icon is still identifiable ([icon-contract.md](./contracts/icon-contract.md) checks).

## Part B — Friendly address (AWS)

Follow [dns-hosting-contract.md](./contracts/dns-hosting-contract.md) in order:

3. **Create + configure the content bucket** `undo-pal.rkocherl.net` (mb → website → public-access-block → policy).

4. **Deploy the site** (including the new icons + manifest) to the new bucket:
   ```bash
   BUCKET=undo-pal.rkocherl.net REGION=us-east-1 deploy/deploy.sh
   ```
   Pre-flight (before DNS): `curl -sI http://undo-pal.rkocherl.net.s3-website-us-east-1.amazonaws.com/` → `200`.

5. **Create the Route53 alias record**:
   ```bash
   aws route53 change-resource-record-sets --hosted-zone-id ZDAFGNLUYZ4PV \
     --change-batch file://deploy/dns-record.json
   ```

6. **Point the old bucket at the new address** (redirect):
   ```bash
   aws s3api put-bucket-website --bucket workout-randomizer-rama-app \
     --website-configuration file://deploy/old-bucket-redirect.json
   ```

7. **Verify** (allow a short DNS propagation window):
   ```bash
   dig +short undo-pal.rkocherl.net
   curl -sI http://undo-pal.rkocherl.net/                 # 200, text/html
   curl -sI http://undo-pal.rkocherl.net/src/app.js       # 200, text/javascript
   curl -sI http://undo-pal.rkocherl.net/favicon.svg      # 200, image/svg+xml
   curl -sI http://workout-randomizer-rama-app.s3-website-us-east-1.amazonaws.com/  # 301 -> undo-pal.rkocherl.net
   ```

8. **No-collateral check** — confirm existing records survived:
   ```bash
   aws route53 list-resource-record-sets --hosted-zone-id ZDAFGNLUYZ4PV \
     --query "ResourceRecordSets[].Name" --output text
   ```
   **Expected**: still includes `dict.rkocherl.net.`, the ACM-validation CNAMEs, apex NS/SOA — plus the new `undo-pal.rkocherl.net.`.

## Part C — Real device checks

9. On a phone browser, open `http://undo-pal.rkocherl.net` → app loads and works (routine, re-roll, persistence).
10. iOS: Share → **Add to Home Screen** → shortcut shows the weightlifting icon (apple-touch-icon).
11. Android/Chrome: menu → **Install/Add to Home screen** → uses the manifest icons.

## Success mapping

| Step | Validates |
|------|-----------|
| 1–2 | FR-007, FR-009, icon rasterization |
| 4, 7 | FR-001, FR-002, FR-003, SC-001, SC-006 |
| 6, 7 | FR-006, SC-005 |
| 8 | FR-005 |
| 10–11 | FR-008 |
