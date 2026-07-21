#!/usr/bin/env bash
#
# Rasterize favicon.svg into the PNG icon sizes the site needs.
# Requires ImageMagick (`magick`). Run from the repository root.
#
#   bash deploy/make-icons.sh
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

command -v magick >/dev/null 2>&1 || { echo "ERROR: ImageMagick (magick) not found on PATH." >&2; exit 1; }

# size:output-file
targets=(
  "32:favicon-32.png"
  "180:apple-touch-icon.png"
  "192:icon-192.png"
  "512:icon-512.png"
)

# iOS home-screen icons must be opaque (iOS applies its own rounding/mask), so
# apple-touch-icon is flattened onto the tile color; the rest keep transparency.
TILE="#4f46e5"

for t in "${targets[@]}"; do
  size="${t%%:*}"
  out="${t##*:}"
  if [[ "$out" == "apple-touch-icon.png" ]]; then
    magick -background "$TILE" favicon.svg -resize "${size}x${size}" -flatten -alpha remove -alpha off "$out"
  else
    magick -background none favicon.svg -resize "${size}x${size}" "$out"
  fi
  echo "wrote $out (${size}x${size})"
done

echo "Done. Generated ${#targets[@]} PNG icons from favicon.svg."
