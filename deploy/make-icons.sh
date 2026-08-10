#!/usr/bin/env bash
#
# Rasterize favicon.svg into the PNG icon sizes the site needs.
# Run after changing favicon.svg. Requires headless Chrome and ImageMagick.
#
#   bash deploy/make-icons.sh
#
# Rendering goes through an <img> at an explicit pixel size on purpose: pointing a
# rasterizer at the standalone SVG lets the viewport drive layout, which produces
# displaced, clipped icons.
set -euo pipefail

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Tile color baked into the opaque icons: iOS composites transparent icons over
# black, and launchers composite home-screen icons over arbitrary wallpaper.
# Keep in sync with --accent in styles.css and <meta name="theme-color">.
TILE="#4f46e5"

for cmd in "$CHROME" magick; do
  command -v "$cmd" >/dev/null 2>&1 || [ -x "$cmd" ] || {
    echo "missing dependency: $cmd" >&2
    exit 1
  }
done

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
cp "$ROOT/favicon.svg" "$WORK/icon.svg"

# render <size-px> <css-background> <padding-px> <output-png>
render() {
  local size="$1" bg="$2" pad="$3" out="$4"
  local inner=$((size - 2 * pad))
  cat > "$WORK/page.html" <<HTML
<body style="margin:0;width:${size}px;height:${size}px;background:${bg}">
<img src="icon.svg" width="${inner}" height="${inner}"
     style="display:block;margin:${pad}px">
</body>
HTML
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --default-background-color=00000000 \
    --screenshot="$out" --window-size="${size},${size}" \
    "file://$WORK/page.html" >/dev/null 2>&1
  magick "$out" -crop "${size}x${size}+0+0" +repage "$out"
}

# flatten <png> — drop the alpha channel onto the tile color.
flatten() {
  magick "$1" -background "$TILE" -alpha remove -alpha off "$1"
}

# Tab favicon: transparent and full bleed, so the figure gets every pixel it can
# at 16-32px.
render 32 transparent 0 "$ROOT/favicon-32.png"

# apple-touch-icon: opaque, inset 10% so iOS's rounded-corner mask doesn't clip it.
render 180 "$TILE" 18 "$ROOT/apple-touch-icon.png"
flatten "$ROOT/apple-touch-icon.png"

# Manifest icons: opaque, inset 14%. That keeps every painted pixel inside the
# maskable safe zone (the centred circle of 80% diameter), which a 10% inset does
# not — the barbell plates reach the corners of the artwork.
for size in 192 512; do
  render "$size" "$TILE" $((size * 14 / 100)) "$ROOT/icon-$size.png"
  flatten "$ROOT/icon-$size.png"
done

echo "wrote favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png in $ROOT"
