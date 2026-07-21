# Data Model: Friendly Address & App Icon

**Feature**: 002-custom-domain-icon
**Date**: 2026-07-20

This feature has no application data model. Its "entities" are the infrastructure record and the set of icon assets. They map to the contracts in [contracts/](./contracts/).

## Entity: Friendly Address (DNS + hosting)

The mapping that makes `undo-pal.rkocherl.net` serve the app.

| Field | Value / Rule |
|-------|--------------|
| Subdomain (FQDN) | `undo-pal.rkocherl.net` |
| Hosted zone | `rkocherl.net.` (Route53 id `ZDAFGNLUYZ4PV`) |
| Record type | Alias `A` |
| Alias target | `s3-website-us-east-1.amazonaws.com` (zone id `Z3AQBSTGFYJSTF`) |
| Content bucket | `undo-pal.rkocherl.net` (us-east-1, website hosting, public-read) — **name must equal the FQDN** |
| Protocol | HTTP only (no TLS) |
| Old endpoint | `workout-randomizer-rama-app` bucket → redirect-all to `undo-pal.rkocherl.net` |

**Invariants**:
- The content bucket name is byte-for-byte equal to the FQDN (Host-header routing requirement).
- Applying the record must not modify any other record in the zone (UPSERT scoped to the one name/type).
- After change, `undo-pal.rkocherl.net` and the old endpoint both reach the app (new serves; old redirects).

Full shapes: see [contracts/dns-hosting-contract.md](./contracts/dns-hosting-contract.md).

## Entity: App Icon Asset Set

The files that give the app a weightlifting identity across tabs and home screens.

| File | Size | Purpose | Required by |
|------|------|---------|-------------|
| `favicon.svg` | scalable | Modern browser tab | FR-007 |
| `favicon-32.png` | 32×32 | Tab fallback (no SVG-favicon support) | FR-007, FR-009 |
| `apple-touch-icon.png` | 180×180 | iOS "Add to Home Screen" | FR-008 |
| `icon-192.png` | 192×192 | Web manifest / Android | FR-008 |
| `icon-512.png` | 512×512 | Web manifest / Android (maskable-safe) | FR-008 |
| `site.webmanifest` | — | Declares name, theme, icon list | FR-008 |

**Derivation rule**: All PNGs are rasterized from the single `favicon.svg` master (one source of truth), so regenerating icons is reproducible.

**Legibility rules (FR-009)**:
- Recognizable at 16–32px (bold filled silhouette, not a thin outline).
- Visible on both light and dark tab backgrounds (icon sits on a filled accent-colored rounded tile).
- ~10% interior padding so the 512 icon is safe as an Android maskable icon.

**Originality rule (FR-010)**: original artwork; no third-party/brand logos.

Full shapes (link tags + manifest schema): see [contracts/icon-contract.md](./contracts/icon-contract.md).

## Relationships

- The **App Icon Asset Set** deploys as ordinary objects into the **Friendly Address** content bucket (and, being static files, is served at `http://undo-pal.rkocherl.net/favicon.svg`, etc.).
- `index.html` references the icon set via `<link>`/manifest; those references are relative, so they work identically on the custom domain and the raw S3 endpoint.
