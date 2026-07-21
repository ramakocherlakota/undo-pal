# DNS & Hosting Contract: undo-pal.rkocherl.net

**Feature**: 002-custom-domain-icon

Defines the exact AWS configuration to serve the app at `http://undo-pal.rkocherl.net`. HTTP only per spec. All operations are idempotent (safe to re-run).

## 1. Content bucket (new)

Bucket name **must equal** the FQDN so the S3 website endpoint answers to the Host header.

```bash
BUCKET=undo-pal.rkocherl.net
REGION=us-east-1
aws s3 mb "s3://$BUCKET" --region "$REGION"
aws s3 website "s3://$BUCKET" --index-document index.html --error-document index.html
aws s3api put-public-access-block --bucket "$BUCKET" \
  --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
# public-read policy (reuse deploy/bucket-policy.json with BUCKET_NAME substituted)
sed "s/BUCKET_NAME/$BUCKET/g" deploy/bucket-policy.json > /tmp/undo-pal-policy.json
aws s3api put-bucket-policy --bucket "$BUCKET" --policy file:///tmp/undo-pal-policy.json
```

Website endpoint: `http://undo-pal.rkocherl.net.s3-website-us-east-1.amazonaws.com` (reachable before DNS is set; useful for pre-flight testing).

## 2. Route53 alias A record (`deploy/dns-record.json`)

```json
{
  "Comment": "Alias undo-pal.rkocherl.net to its S3 website endpoint (HTTP)",
  "Changes": [
    {
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "undo-pal.rkocherl.net",
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": "Z3AQBSTGFYJSTF",
          "DNSName": "s3-website-us-east-1.amazonaws.com",
          "EvaluateTargetHealth": false
        }
      }
    }
  ]
}
```

- `Z3AQBSTGFYJSTF` is the fixed Route53 hosted-zone ID for **S3 website endpoints in us-east-1** (not our zone id).
- Apply:
  ```bash
  aws route53 change-resource-record-sets --hosted-zone-id ZDAFGNLUYZ4PV \
    --change-batch file://deploy/dns-record.json
  ```
- **Scope guard**: the change-batch contains exactly one `UPSERT` for `undo-pal.rkocherl.net` A. It must not include any other record (protects `dict`, ACM CNAMEs, apex NS/SOA — FR-005).

## 3. Old bucket redirect (`deploy/old-bucket-redirect.json`)

```json
{
  "RedirectAllRequestsTo": { "HostName": "undo-pal.rkocherl.net", "Protocol": "http" }
}
```

```bash
aws s3api put-bucket-website --bucket workout-randomizer-rama-app \
  --website-configuration file://deploy/old-bucket-redirect.json
```

Result: `http://workout-randomizer-rama-app.s3-website-us-east-1.amazonaws.com/...` → 301 → `http://undo-pal.rkocherl.net/...` (FR-006).

## 4. Deploy content (`deploy/deploy.sh`, edited)

Sync the site — including the new icon assets and manifest — to the **new** bucket, and set the manifest content type:

```bash
aws s3 sync . "s3://undo-pal.rkocherl.net" \
  --exclude "*" \
  --include "index.html" --include "styles.css" --include "src/*" \
  --include "favicon.svg" --include "*.png" --include "site.webmanifest" \
  --delete
# ensure correct MIME for the manifest (sync may not know .webmanifest)
aws s3 cp site.webmanifest "s3://undo-pal.rkocherl.net/site.webmanifest" \
  --content-type "application/manifest+json" --metadata-directive REPLACE
```

## Acceptance checks (→ quickstart)

- [ ] `dig +short undo-pal.rkocherl.net` returns S3 website IPs.
- [ ] `curl -sI http://undo-pal.rkocherl.net/` → `200`, `content-type: text/html`.
- [ ] `curl -sI http://undo-pal.rkocherl.net/src/app.js` → `200`, `content-type: text/javascript`.
- [ ] `curl -sI http://workout-randomizer-rama-app.s3-website-us-east-1.amazonaws.com/` → `301` with `Location: http://undo-pal.rkocherl.net/`.
- [ ] Other `rkocherl.net` records unchanged (`dict`, ACM CNAMEs, NS/SOA still present).

## Rollback

```bash
# remove the alias record (swap Action to DELETE with the same ResourceRecordSet), and optionally:
aws s3 rb s3://undo-pal.rkocherl.net --force
# restore old bucket to serve content:
aws s3 website s3://workout-randomizer-rama-app --index-document index.html --error-document index.html
```
