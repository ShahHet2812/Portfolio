# Portfolio — hetshah.xyz

Personal portfolio with a terminal/IDE aesthetic. React frontend, Cloudflare
Worker API, D1 (SQLite) database — all deployed as a single Worker on one
domain.

```
frontend/   Vite + React + TypeScript. Builds to frontend/dist.
worker/     Hono API + static asset hosting + D1 schema, seed and migrations.
backend/    Retired Express + MongoDB service. See "Retiring the old stack".
```

## Architecture

One Worker serves everything, so the site and API share an origin and there is
no CORS to configure:

| Path        | Handled by                                      |
| ----------- | ----------------------------------------------- |
| `/api/*`    | Hono routes in `worker/src/index.ts`            |
| everything else | Static assets from `frontend/dist`, with SPA fallback |

Data lives in D1. Multi-valued fields (tech stacks, screenshots, bullet lists)
are normalised into child tables and reassembled in `worker/src/db.ts`, so API
responses keep the array shapes the frontend expects. Queries are hand-written
SQL — no ORM.

### API

| Method | Route               | Notes                                  |
| ------ | ------------------- | -------------------------------------- |
| GET    | `/api/health`       | Liveness plus a D1 connectivity check  |
| GET    | `/api/projects`     |                                        |
| GET    | `/api/experience`   | Newest first; `endDate: null` = current |
| GET    | `/api/testimonials` |                                        |
| GET    | `/api/hackathons`   | Sorted by derived `sort_date`          |
| POST   | `/api/contact/add`  | Validated, rate limited, emails a copy |

## Local development

Install dependencies in both packages:

```bash
npm --prefix frontend install
npm --prefix worker install
```

Create the local database and load the seed data:

```bash
cd worker
npm run db:migrate:local
npm run db:seed:local
```

Then either run the Worker alone, serving the last production build:

```bash
npm --prefix frontend run build
cd worker && npm run dev          # http://localhost:8787
```

…or run Vite with hot reload against the Worker's API. Point the frontend at
the Worker by copying `frontend/.env.example` to `frontend/.env` and setting:

```
VITE_API_URL=http://localhost:8787/api
```

With no `.env` at all the frontend defaults to the same-origin `/api`, which is
what production uses.

For contact emails locally, copy `worker/.dev.vars.example` to
`worker/.dev.vars` and add a Resend key. Without one the message is still
saved; only the notification is skipped.

## First-time deployment

1. **Authenticate.**

   ```bash
   cd worker && npx wrangler login
   ```

2. **Create the database** and copy the printed `database_id` into the
   `d1_databases` block of `worker/wrangler.jsonc`, replacing
   `REPLACE_WITH_D1_DATABASE_ID`:

   ```bash
   npx wrangler d1 create portfolio
   ```

3. **Create the schema and load the data:**

   ```bash
   npm run db:migrate     # applies db/schema.sql to the remote database
   npm run db:seed        # loads db/seed.sql
   ```

   Both are destructive — `schema.sql` drops and recreates every table, and
   `seed.sql` clears the content tables before inserting. Neither touches
   `contacts` on seed, but `db:migrate` does drop it, so only re-run the
   migration deliberately.

4. **Set the mail secret** (see below):

   ```bash
   npx wrangler secret put RESEND_API_KEY
   ```

5. **Deploy.** This builds the frontend first, then uploads both the Worker and
   the static assets:

   ```bash
   npm run deploy
   ```

6. **Attach the domain** — see below, since `hetshah.xyz` has to move to
   Cloudflare DNS first.

Subsequent deploys are just `npm run deploy` from `worker/`.

## Moving hetshah.xyz to Cloudflare

Workers custom domains only work for zones on Cloudflare DNS. The domain is
registered at GoDaddy (`ns71`/`ns72.domaincontrol.com`) and currently points at
Vercel, so the nameservers need to change. The registration stays at GoDaddy —
only DNS hosting moves, and it's free.

The domain carries no MX, TXT or subdomain records, so the website is the only
thing affected.

1. In the Cloudflare dashboard, **Add a site** → `hetshah.xyz` → Free plan.
2. Let the scan import the existing records. They point at Vercel, which is
   what keeps the site up during the switch — don't delete them yet.
3. Copy the two Cloudflare nameservers it gives you.
4. At GoDaddy: Domain → Nameservers → Change → Custom, and replace both
   `domaincontrol.com` entries with the Cloudflare pair.
5. Wait for Cloudflare to mark the zone **Active** (usually under an hour).
   Vercel serves the site the whole time.
6. Then, under Workers & Pages → portfolio → Settings → Domains & Routes, add
   `hetshah.xyz` and `www.hetshah.xyz` as custom domains. Cloudflare replaces
   the Vercel DNS records and issues certificates automatically.

Once traffic is served by the Worker, the `workers.dev` route can be switched
off in the same settings page so the site answers only on the real domain.

## Contact email

Workers have no SMTP stack, so notifications go out over Resend's HTTP API
rather than nodemailer/Gmail.

1. Sign up at [resend.com](https://resend.com) and verify `hetshah.xyz` under
   Domains — this means adding the DNS records they show you. Since the domain
   is already on Cloudflare, that is a few records in the same dashboard.
2. Create an API key and set it as the `RESEND_API_KEY` secret.
3. `MAIL_FROM` in `wrangler.jsonc` must be an address on the verified domain.

Recipient and sender are configured as plain vars in `wrangler.jsonc`
(`NOTIFY_EMAIL`, `MAIL_FROM`, `SITE_NAME`). Only the API key is a secret.

If the key is missing or Resend errors, the submission is still written to D1
and the failure is logged — a message is never lost because mail failed. The
`contacts.notified` column records whether the notification went out.

## Changing content

Content lives in `worker/db/data/*.json`. Edit it, then regenerate and reload:

```bash
cd worker
node db/generate-seed.mjs
npm run db:seed          # or db:seed:local
```

The generator is deterministic: ids carried over from MongoDB are reused, and
records that never existed there get an id derived from a hash of their natural
key, so re-running produces identical SQL.

Free-text hackathon dates (`"August 11–12, 2025"`, `"21st - 23rd March 2025"`)
are parsed into a sortable `sort_date` at generation time, which is what the
API orders by. Watch the generator output for parse warnings when adding one.

## Reading contact submissions

```bash
cd worker
npx wrangler d1 execute portfolio --remote \
  --command="SELECT created_at, name, email, message FROM contacts ORDER BY created_at DESC LIMIT 20;"
```

## Motion and 3D

- `Reveal` (`src/components/motion/Reveal.tsx`) — scroll-triggered fade and
  lift, used by every section heading and card list.
- `Tilt` (`src/components/motion/Tilt.tsx`) — pointer-tracking 3D tilt on
  project cards.
- `HeroScene` (`src/components/three/HeroScene.tsx`) — three.js point lattice
  behind the hero.

`HeroScene` is ~820KB, so it is lazy-loaded via `React.lazy` into its own chunk
and only mounted on viewports ≥768px with ≥4 cores. Everything here also
honours `prefers-reduced-motion`, dropping to static rendering.

## Retiring the old stack

`backend/` is the previous Express + MongoDB service, kept only as a reference
during cutover. Once the Worker is live and verified, it can be deleted along
with the Render service and the MongoDB Atlas cluster.

Its data was exported through the public API into `backend/data/*.json` and now
lives in `worker/db/data/`. One thing did **not** come across: past **contact
submissions**, which were never exposed by a GET route. If you want them,
reset the Atlas password (that does not require knowing the old one), export
the `contacts` collection, and insert the rows into D1.
