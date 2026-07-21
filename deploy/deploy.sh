#!/usr/bin/env bash
#
# Deploy the Daily Workout Randomizer to an AWS S3 static website bucket.
# See specs/001-workout-randomizer/contracts/deployment-contract.md for details.
#
# Usage:
#   BUCKET=my-workout-bucket REGION=us-east-1 deploy/deploy.sh
#
# Prerequisites: AWS CLI v2 configured (`aws configure`) with permission to
# manage the target bucket. Run from the repository root.

set -euo pipefail

# Canonical content bucket is the custom-domain bucket; override BUCKET to target another.
BUCKET="${BUCKET:-undo-pal.rkocherl.net}"
REGION="${REGION:-us-east-1}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# --- One-time bucket setup (uncomment on first deploy) -----------------------
# aws s3 mb "s3://${BUCKET}" --region "${REGION}"
# aws s3 website "s3://${BUCKET}" --index-document index.html --error-document index.html
# # Disable "Block Public Access" for the bucket in the console or via CLI, then:
# sed "s/BUCKET_NAME/${BUCKET}/g" deploy/bucket-policy.json > /tmp/bucket-policy.json
# aws s3api put-bucket-policy --bucket "${BUCKET}" --policy file:///tmp/bucket-policy.json
# -----------------------------------------------------------------------------

# Sync only the web assets (exclude specs/tests/deploy/docs/dotfiles).
aws s3 sync . "s3://${BUCKET}" \
  --exclude "*" \
  --include "index.html" \
  --include "styles.css" \
  --include "src/*" \
  --include "favicon.svg" \
  --include "*.png" \
  --include "site.webmanifest" \
  --delete

# aws s3 sync doesn't know the .webmanifest extension; set its content type explicitly
# so browsers accept the manifest.
aws s3 cp "s3://${BUCKET}/site.webmanifest" "s3://${BUCKET}/site.webmanifest" \
  --content-type "application/manifest+json" \
  --metadata-directive REPLACE >/dev/null

echo ""
echo "Deployed to: http://${BUCKET}.s3-website-${REGION}.amazonaws.com"
if [[ "${BUCKET}" == "undo-pal.rkocherl.net" ]]; then
  echo "Custom domain: http://undo-pal.rkocherl.net"
fi
