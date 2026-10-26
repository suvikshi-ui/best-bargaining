# Best Bargain

Deploy marker — pushed to verify Vercel auto-deploy linkage.

Live URL should appear at the Vercel project dashboard once the GitHub repo is connected.

Trigger: 2026-10-16T22:15:00+05:30

## Owner email lock (`OWNER_EMAIL`)

Set `OWNER_EMAIL` (e.g. `lokesh@bestbargain.in`) in the Vercel project's
Environment Variables (Production, and Preview if wanted), then redeploy.

- When set, only the signed-in account with that email (case-insensitive) can
  use `/studio` as owner. Any other account is treated as not the owner, even
  if it was the first to sign in.
- The first time the matching account opens `/studio`, it becomes the owner
  (replacing any previous owner in the `shop` table) and the previous owner's
  products are moved to it. No manual database change is needed.
- The owner account must exist: sign up at `/login` with exactly that email.
  Customer sign-up stays open.
- When unset, the old behaviour applies: the first account to sign in to
  `/studio` becomes the owner.

## Owner desk host (`STUDIO_HOST`)

`/studio` and `/login` (and owner server actions) only work on `STUDIO_HOST`
(default `studio.bestbargain.in`), plus localhost, `*.vercel.app` and preview
hosts. On `bestbargain.in` / `www.bestbargain.in` they return 404, and public
pages carry no owner/login links. To go live:

1. Vercel → project → Domains: add `studio.bestbargain.in`.
2. GoDaddy DNS: CNAME `studio` → the target Vercel shows for that domain.
3. Optional env: `STUDIO_HOST=studio.bestbargain.in` (default already matches).
