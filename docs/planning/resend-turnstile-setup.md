# Resend + Turnstile setup requirements

Status: **not yet configured anywhere.** `src/pages/api/contact.ts` and
`checkout.ts` both stay in their honest "not configured" (503) state
until every credential below is set — see each route's file comment.
No account has been created and no credential exists yet; this
document is the reference for doing that, one step at a time, when you
choose to (CLAUDE.md §9: creating external accounts and activating a
paid service both require your explicit action, not mine).

`cloudpeptides.org` was purchased 2026-08-07 and its nameservers are
propagating to Cloudflare — DNS is **not active yet**. Resend
specifically cannot be set up until that propagation finishes and the
zone is live (it needs to create real DNS records); this document
names the intended domains now so the eventual walkthrough is concrete,
not so you act on them today. Do not create the Resend domain or
request any DNS record from this document until you say DNS is ready.

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
you actually reach it in the walkthrough — and it's mechanically
blocked until `cloudpeptides.org`'s Cloudflare zone finishes
propagating** (Resend needs a live zone to hand DNS records to):

- **Intended sending domain: `updates.cloudpeptides.org`** — a
  subdomain of the production domain, not the bare domain itself.
  Using a subdomain dedicated to transactional mail is standard
  practice (keeps SPF/DKIM/DMARC scoped to outbound mail, isolated
  from any future use of the bare domain or other subdomains for
  something else) and is a low-risk, easily-changed choice — flag now
  if you'd prefer a different subdomain or the bare domain instead.
- **Suggested `RESEND_FROM_ADDRESS`: `notifications@updates.
  cloudpeptides.org`.** This project's current destination inbox
  (`info.order.thecloud@proton.me`, the `to` address both routes
  already send to) is unaffected — this is only the outbound `from`.
- Resend generates the exact TXT/CNAME records once you add
  `updates.cloudpeptides.org` as a domain in its dashboard — I cannot
  predict them in advance.
- You (or I, with your explicit per-record approval at that point) add
  those records at Cloudflare (since the zone will already be there).
- Resend re-checks and marks the domain verified — usually minutes,
  sometimes longer depending on DNS propagation.

## Turnstile — domain association

Turnstile widgets are scoped to specific hostnames. When creating the
widget in the Cloudflare dashboard, add all of:
- `cloudpeptides-staging.jessica-holsopple3.workers.dev` (the current
  staging Worker) so the widget renders there now — this one can be
  added today, independent of DNS.
- `cloudpeptides.org` — the production apex domain.
- `www.cloudpeptides.org` — in case `www` ever serves content directly
  rather than only redirecting (see the production cutover plan §6's
  open question on which form is canonical); harmless to list even if
  `www` ends up being redirect-only and never actually serves the
  widget.

Turnstile widgets support multiple associated hostnames on one
sitekey, so all three can be added to the *same* widget rather than
creating separate ones — avoiding a credential rotation at cutover.
No DNS or domain-ownership proof is required for Turnstile beyond
listing the hostname in its dashboard — unlike Resend, it doesn't need
a DNS record added, so the `cloudpeptides.org`/`www` hostnames can be
added to the widget now even before DNS finishes propagating (Turnstile
doesn't verify the hostname resolves, only checks it against the
Origin header of real requests later).

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

Steps 1 and 5–7 don't depend on DNS and can happen anytime; step 2
(and therefore 3–4, which need a verified `from` address) is blocked
until `cloudpeptides.org`'s Cloudflare zone is active.

1. Create the Resend account (you) — can happen now.
2. **Blocked until DNS is active.** Add and verify `updates.
   cloudpeptides.org` as a sending domain in Resend (you create the
   DNS records at Cloudflare, with my help reading Resend's
   instructions — I do not apply DNS changes without your explicit
   approval per record).
3. Generate a Resend API key (you generate it in the dashboard; you
   store it via `wrangler secret put RESEND_API_KEY`, not pasted into
   chat).
4. Set `RESEND_FROM_ADDRESS=notifications@updates.cloudpeptides.org`
   (or whichever address you confirm) as a Worker secret.
5. Create a Cloudflare Turnstile widget with the staging hostname —
   can happen now; add `cloudpeptides.org` and `www.cloudpeptides.org`
   to the same widget whenever convenient, before or after DNS is
   live.
6. Store `TURNSTILE_SECRET_KEY` as a Worker secret and
   `PUBLIC_TURNSTILE_SITE_KEY` as a Worker var (both via `wrangler
   secret put` / `wrangler.jsonc` `vars`, not chat).
7. Deploy, then verify live: contact/checkout forms render the
   Turnstile widget, reject submissions without a valid token, and a
   real submission delivers email.
