# Resend + Turnstile setup requirements

Status: **not yet configured anywhere.** `src/pages/api/contact.ts` and
`checkout.ts` both stay in their honest "not configured" (503) state
until every credential below is set — see each route's file comment.
No account has been created and no credential exists yet; this
document is the reference for doing that, one step at a time, when you
choose to (CLAUDE.md §9: creating external accounts and activating a
paid service both require your explicit action, not mine).

## What gets created

1. A [Resend](https://resend.com) account, a verified sending domain,
   and an API key.
2. A [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
   widget (a sitekey + secret key pair), associated with the staging
   Worker's hostname (and, later, the production domain).

Both are free at this project's scale (Turnstile has no paid tier at
all; Resend's free tier covers low-volume transactional email, which
is all a contact/order-request form needs).

## Exact credential names required

| Name | Kind | Where it's set | Read by |
|---|---|---|---|
| `RESEND_API_KEY` | secret | Cloudflare Worker secret | `src/pages/api/contact.ts`, `checkout.ts` via `env.RESEND_API_KEY` |
| `RESEND_FROM_ADDRESS` | secret | Cloudflare Worker secret | same, `env.RESEND_FROM_ADDRESS` |
| `TURNSTILE_SECRET_KEY` | secret | Cloudflare Worker secret | same, `env.TURNSTILE_SECRET_KEY` |
| `PUBLIC_TURNSTILE_SITE_KEY` | public var | `.env.local` (dev) + Cloudflare Worker var (deployed) | `src/scripts/turnstile-widget.ts` via `import.meta.env.PUBLIC_TURNSTILE_SITE_KEY` — safe to expose, sitekeys are designed to be public |

All three secrets are set via `wrangler secret put <NAME> --config
wrangler.jsonc` (or the Cloudflare dashboard's Worker → Settings →
Variables page) — never written into `wrangler.jsonc`, `.env.example`,
or any other committed file. `.env.example` documents the names only,
with empty values, exactly as it already does for the Supabase
credentials.

Local development additionally needs `RESEND_API_KEY`,
`RESEND_FROM_ADDRESS`, and `TURNSTILE_SECRET_KEY` in `.dev.vars`
(wrangler's local-secret file, already gitignored the same way
`.env.local` is) if you want to exercise the real send path with
`wrangler dev` — optional; the routes already have honest, tested
"not configured" behavior without it.

## Domain verification (Resend) — no DNS changes made now

Resend requires verifying the sending domain via DNS records (SPF,
DKIM, and a DMARC recommendation) before it will deliver mail from
that domain. This project's CLAUDE.md §9 requires your explicit
approval before any DNS change, so this step is **out of scope until
you actually reach it in the walkthrough** — documented here so you
know what's coming:

- A domain to send from (this project's current inbox is
  `info.order.thecloud@proton.me`, referenced as the `to` address in
  both routes — the `from` address needs to be on a domain you
  control and can add DNS records to; it does not have to be
  `cloudpeptides.github.io` specifically, and does not need to be the
  eventual production domain).
- Resend generates the exact TXT/CNAME records once you add the
  domain in its dashboard — I cannot predict them in advance.
- You (or I, with your explicit per-record approval at that point) add
  those records at your DNS provider.
- Resend re-checks and marks the domain verified — usually minutes,
  sometimes longer depending on DNS propagation.

## Turnstile — domain association

Turnstile widgets are scoped to specific hostnames. When creating the
widget in the Cloudflare dashboard, add:
- `cloudpeptides-staging.jessica-holsopple3.workers.dev` (the current
  staging Worker) so the widget renders there now.
- The eventual production domain, added later at cutover — Turnstile
  widgets support multiple associated hostnames on one sitekey, so
  this can be added to the *same* widget rather than creating a new
  one, avoiding a credential rotation at cutover.

No DNS or domain-ownership proof is required for Turnstile beyond
listing the hostname in its dashboard — unlike Resend, it doesn't
need a DNS record added.

## What's already built and waiting

- Both routes already implement layered abuse defense (body-size
  limit → honeypot → cookie cooldown → Cloudflare rate-limit binding)
  independent of these credentials, and already call
  `verifyTurnstileToken`/`sendEmail` correctly — activating the
  feature is purely a matter of setting the three secrets and one
  public var above, no further code change.
- `src/scripts/turnstile-widget.ts` already renders the widget into
  any `[data-turnstile]` container once `PUBLIC_TURNSTILE_SITE_KEY` is
  set, and no-ops (renders nothing, form still works via the other
  defense layers) while it's unset.
- The CSP (`src/lib/security-headers.ts`) already allows
  `https://challenges.cloudflare.com` for `script-src`, `connect-src`,
  and `frame-src` — the widget will work the moment a sitekey is set,
  no header change needed.

## Order of operations for the walkthrough

1. Create the Resend account (you).
2. Add and verify a sending domain in Resend (you create the DNS
   records, with my help reading Resend's instructions — I do not
   apply DNS changes without your explicit approval per record).
3. Generate a Resend API key (you generate it in the dashboard; you
   store it via `wrangler secret put RESEND_API_KEY`, not pasted into
   chat).
4. Set `RESEND_FROM_ADDRESS` as a Worker secret (the verified
   send-from address from step 2).
5. Create a Cloudflare Turnstile widget for the staging hostname (you,
   in the Cloudflare dashboard).
6. Store `TURNSTILE_SECRET_KEY` as a Worker secret and
   `PUBLIC_TURNSTILE_SITE_KEY` as a Worker var (both via `wrangler
   secret put` / `wrangler.jsonc` `vars`, not chat).
7. Deploy, then verify live: contact/checkout forms render the
   Turnstile widget, reject submissions without a valid token, and a
   real submission delivers email.
