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
