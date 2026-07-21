# Icon Contract: Weightlifting App Icon

**Feature**: 002-custom-domain-icon

Defines the icon files, the `index.html` markup, and the manifest that give the app a weightlifting identity in browser tabs and phone home screens.

## Required files (repository root)

| File | Size | Format / notes |
|------|------|----------------|
| `favicon.svg` | scalable | `image/svg+xml`. Master artwork; all PNGs derive from it. |
| `favicon-32.png` | 32×32 | `image/png`. Tab fallback. |
| `apple-touch-icon.png` | 180×180 | `image/png`. iOS home screen. No transparency (iOS adds its own mask). |
| `icon-192.png` | 192×192 | `image/png`. Manifest icon. |
| `icon-512.png` | 512×512 | `image/png`. Manifest icon; ~10% padding so it's maskable-safe. |
| `site.webmanifest` | — | `application/manifest+json`. |

## `index.html` markup (added inside `<head>`)

```html
<link rel="icon" href="favicon.svg" type="image/svg+xml" />
<link rel="icon" href="favicon-32.png" sizes="32x32" type="image/png" />
<link rel="apple-touch-icon" href="apple-touch-icon.png" />
<link rel="manifest" href="site.webmanifest" />
<meta name="theme-color" content="#4f46e5" />
```

- The existing `<meta name="theme-color" content="#0f172a">` should be reconciled to a single value (`#4f46e5` accent, matching the icon tile) — no duplicate theme-color tags.
- All hrefs are root-relative filenames, so they resolve the same on `undo-pal.rkocherl.net` and the raw S3 endpoint.

## `site.webmanifest` schema

```json
{
  "name": "Daily Workout Randomizer",
  "short_name": "Workout",
  "description": "A random daily workout for each muscle group.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#4f46e5",
  "icons": [
    { "src": "icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

## Artwork spec (FR-007, FR-009, FR-010)

- **Motif**: a bold, simplified figure pressing a barbell overhead (the "somebody lifting a weight" request). If the figure is illegible at 16px in review, fall back to a clean centered barbell.
- **Composition**: white/light glyph on a filled **accent (`#4f46e5`) rounded-square** tile, so the icon reads on both light and dark tab strips (FR-009). ~10% interior padding.
- **Original**: hand-drawn geometry only; no third-party or brand logos (FR-010).
- **Derivation**: rasterize all PNGs from `favicon.svg` via `deploy/make-icons.sh` (ImageMagick), so sizes stay consistent with the master.

## `deploy/make-icons.sh` behavior

```bash
# from repo root; regenerates every PNG from favicon.svg
for spec in "32:favicon-32.png" "180:apple-touch-icon.png" "192:icon-192.png" "512:icon-512.png"; do
  size="${spec%%:*}"; out="${spec##*:}"
  magick -background none favicon.svg -resize "${size}x${size}" "$out"
done
```
(apple-touch-icon may be flattened onto the tile background rather than transparent; see artwork spec.)

## Acceptance checks (→ quickstart)

- [ ] Browser tab shows the weightlifting icon (not the default globe/blank).
- [ ] `favicon.svg` served as `image/svg+xml`; `site.webmanifest` as `application/manifest+json`.
- [ ] All five icon files return `200` from the site root.
- [ ] Icon is identifiable at 16–32px and visible on a light and a dark tab background.
- [ ] iOS "Add to Home Screen" shows the icon (apple-touch-icon); Android install uses the manifest icons.
