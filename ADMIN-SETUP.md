# Owner dashboard activation

Implementation is local; do not deploy until Access is ready. Production continues using the previous version. This release retires email bearer approval links and requires the dashboard for moderation.

## 1. Cloudflare Access (required)

In Cloudflare Zero Trust, add a self-hosted application covering **all paths** on `admin.hetshah.xyz` (not only `/admin`). Use Google as the identity provider. Allow only `shahhet28122004@gmail.com`; do not add Everyone, bypass policies, email-domain-wide access, or service-token policies.

Require independent MFA using a WebAuthn security key or biometric authenticator. Enroll your own device and a backup authenticator. Choose a short application session, such as one hour. Protect the Cloudflare account itself with MFA too. No application can promise access remains exclusive if its owner account or device is compromised.

Record the team domain (`your-team.cloudflareaccess.com`), application audience (AUD), and your Access identity UUID (JWT `sub`). Obtain the identity from Cloudflare's authenticated user record, not an unverified token supplied by someone else.

Set Worker secrets from the `worker` directory:

```sh
npx wrangler secret put ACCESS_TEAM_DOMAIN
npx wrangler secret put ACCESS_AUD
npx wrangler secret put OWNER_SUB
```

The Worker verifies the JWT signature, issuer, audience, expiration, owner subject and exact email. Missing configuration denies access. Admin APIs on the public domain or workers.dev return 404. Mutations require the admin origin and a custom request header. HTML and admin API responses are private/no-store.

Add `admin.hetshah.xyz` as a custom domain for the existing `portfolio` Worker **after the Access application is configured**. Keep `hetshah.xyz` as it is. `run_worker_first: true` is required; removing it can bypass authentication for static assets.

Reference: [Cloudflare independent MFA](https://developers.cloudflare.com/cloudflare-one/access-controls/access-settings/independent-mfa/).

## 2. Cloudflare R2 (required for images)

The account currently returns error 10042: R2 must be enabled in the Cloudflare dashboard. Review any billing requirements there yourself before enabling it.

Then create a private bucket:

```sh
npx wrangler r2 bucket create portfolio-media
```

Add this top-level binding to `worker/wrangler.jsonc`:

```json
"r2_buckets": [{ "binding": "MEDIA", "bucket_name": "portfolio-media" }]
```

Keep the bucket private; do not enable r2.dev or a public bucket domain. The Worker serves images only if an associated entry is published AND its section is enabled. Draft previews require owner authentication. Removing an image from an entry does not erase its object: older revisions remain recoverable.

## 3. Google image import

**Drive:** paste an individual publicly viewable Drive image link and choose Import. Downloads are restricted to Google hosts and 20 MB, then decoded/re-encoded locally and uploaded to R2. The original URL remains private in the entry. A private Drive file can instead be downloaded manually and uploaded without changing its sharing permissions.

**Google Photos:** enable the Photos Picker API in your Google Cloud project, configure OAuth consent with yourself as a test user if applicable, and create a Web application OAuth client. Set the authorized JavaScript origin to `https://admin.hetshah.xyz`. Set `GOOGLE_CLIENT_ID` as a Worker variable or secret and redeploy. No client secret belongs in the frontend.

```sh
npx wrangler secret put GOOGLE_CLIENT_ID
```

The dashboard requests only `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`. Click Connect, open the selection link, choose one still photo, return and click Import selected photo. The access token stays in memory (never D1 or browser storage); the successful selection session is deleted after import. Generic Google Photos search/share links are not direct image URLs; use the picker or download/upload fallback.

Reference: [Google Photos Picker sessions](https://developers.google.com/photos/picker/reference/rest/v1/sessions).

## 4. Database and deployment

Take an existing D1 backup/export through Cloudflare before migration. Apply **only the additive migration**, never `db/schema.sql` (the latter drops original tables).

```sh
cd worker
npm test
npm run typecheck
npm run db:admin
npm run deploy
```

The new tables preserve existing contacts, testimonials, projects and experience. Photos/blog/interests default to hidden. Old emailed review links return 410 after deployment; all submissions remain available through the dashboard. Existing Resend configuration is reused for notifications.

## 5. Acceptance checks before enabling content

- Incognito admin visit requires Google login and the enrolled second factor. A different account is denied.
- `hetshah.xyz/api/admin/messages` and the equivalent workers.dev path return 404; unsigned admin requests return 403 (503 before configuration).
- Submit a test testimonial; approve/unpublish it from the dashboard and verify public visibility changes. Email links must open the protected dashboard.
- Read/archive/trash/restore a contact. Permanent deletion requires trash first and an explicit confirmation.
- Import a photo; save a draft with optional caption/story. No draft image or source URL should be public.
- Publish an entry, then separately enable its section. Disable the section and confirm its public API/image access disappears.
- Restore a revision into the editor and save it as a draft. Conflicting saves from another tab return 409.
- Confirm existing contact email delivery, experience, projects and public navigation still work.

Automated tests exercise authentication failures, valid owner access, CSRF, content visibility, migration repeatability, inbox state, legacy approval retirement and testimonial privacy. Google consent, actual R2 uploads and real MFA still need end-to-end validation after external setup.

Current limits: inbox and review lists show the latest 1,000 records; audit shows 200; history shows 50 revisions. Blog text is plain text (safe preview, not a rich-text editor). Trash/revisions retain content and images; only contact messages currently support irreversible deletion.
