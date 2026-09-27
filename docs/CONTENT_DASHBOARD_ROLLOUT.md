# Content dashboard rollout

The application code and additive D1 schema are deployable while Lab and Journal remain hidden. Do not enable dashboard moderation until every check below passes.

## 1. Cloudflare R2

1. Activate R2 on the existing Cloudflare account.
2. Create a **Standard** private bucket named `portfolio-media`.
3. Do not enable its `r2.dev` public URL.
4. Add this binding to `worker/wrangler.jsonc`, then deploy:

```jsonc
"r2_buckets": [
  { "binding": "MEDIA", "bucket_name": "portfolio-media" }
]
```

Configure usage notifications below the free-plan allowances (for example 8 GB stored, 800,000 Class A operations, and 8,000,000 Class B operations). The media API returns `503` until this binding exists and never exposes object keys.

## 2. Cloudflare Access

1. Add `admin.hetshah.me` as a Worker custom domain only after Access is ready.
2. Create an Access self-hosted application for exactly `admin.hetshah.me/*`.
3. Set the session duration to one hour.
4. Allow only Google identity `shahhet28122004@gmail.com`.
5. Require an independent WebAuthn/security-key authentication method in the policy. Do not treat the Google login alone as the second factor.
6. Add these Worker variables (the audience value comes from the Access application):

```jsonc
"ACCESS_TEAM_DOMAIN": "YOUR_TEAM.cloudflareaccess.com",
"ACCESS_AUD": "YOUR_ACCESS_APPLICATION_AUD_TAG",
"ADMIN_EMAIL": "shahhet28122004@gmail.com"
```

The Worker fails closed if either Access setting is absent. It validates signature, issuer, audience, expiry, subject and exact owner email. Mutations also require the exact admin origin and `X-Admin-Action` header.

## 3. Verification and moderation cutover

Verify all of these before changing the moderation flag:

- An unauthenticated request to `admin.hetshah.me` is stopped by Access.
- A different Google account is denied.
- The owner can upload and retrieve a draft image in the dashboard.
- Draft images cannot be retrieved through the public media route.
- Messages are visible and can move through read/archive/trash/restore.
- A pending testimonial can be approved and unpublished in the dashboard.

Only then set `ADMIN_MODERATION_ENABLED=true`. Until that flag is set, the existing private email approval links remain operational. Afterward, new notification emails link to the protected dashboard and old bearer approval routes return `410`.

## 4. Publishing

Create real drafts, attach images with useful alt text, and publish an entry. The Section Visibility screen refuses to enable an empty section. Enabling Lab or Journal makes its navbar item, terminal commands, feed, sitemap entries and published media available together.

Never include employer/customer names, internal addresses, credentials, proprietary diagrams, real attack targets, or confidential incident details.
