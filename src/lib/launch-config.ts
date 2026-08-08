/**
 * Single, explicit switch for the "research-platform-first" launch
 * phase. Commerce transactions and the public contact form are each
 * independently gated — plain booleans (not derived from Cloudflare
 * env vars the way RESEND_API_KEY/TURNSTILE_SECRET_KEY are) because
 * each is a deliberate product decision for a specific launch, flipped
 * by hand when the team is actually ready for that specific feature,
 * not something that should vary per deploy environment.
 *
 * Every place that would accept an order, run Add-to-Cart, or send
 * real email checks the relevant flag — checked in BOTH the UI (so
 * visitors see an honest state, never a form that silently fails) AND
 * the API routes themselves (src/pages/api/checkout.ts, contact.ts —
 * the real backstop: even with JavaScript disabled, dev tools, or a
 * replayed request, neither route can ever accept a submission while
 * its flag is false, regardless of whether RESEND_API_KEY/
 * TURNSTILE_SECRET_KEY happen to be configured).
 *
 * Re-enabling a feature requires flipping the relevant constant here,
 * un-hiding the corresponding form markup, and confirming Resend/
 * Turnstile are genuinely configured — not re-deriving this gating
 * logic from scratch.
 */

/** Add-to-Cart, the cart/checkout page, and the order-request email
 * route (src/pages/api/checkout.ts) are all disabled while this is
 * false. The shop catalog itself (browsing products, prices) stays
 * visible as a "Coming soon" preview — this flag governs the
 * transactional path only.
 *
 * Activated 2026-08-08 (Commerce Activation phase) — approved product
 * decision: this enables an order-*request* workflow only (see
 * src/pages/api/checkout.ts's own header comment). No payment
 * provider is integrated anywhere in this codebase; submitting the
 * cart form never charges the customer, accepts an order, or reserves
 * inventory. src/pages/shop/cart.astro's own visible test-environment
 * banner (driven by Astro.locals.indexable) and checkout.ts's
 * matching email-subject prefix keep staging submissions unmistakably
 * labeled as test orders, not real customer orders. */
export const COMMERCE_ENABLED = true;

/** The public contact form (src/pages/contact.astro) and its email
 * route (src/pages/api/contact.ts) are disabled while this is false.
 * Static contact options (Discord/email/phone) remain visible — they
 * don't depend on Resend/Turnstile at all.
 *
 * Activated 2026-08-07 (staging only): Resend's sending domain is
 * verified and RESEND_API_KEY/RESEND_FROM_ADDRESS/TURNSTILE_SECRET_KEY
 * are configured as secrets on the cloudpeptides-staging Worker (see
 * docs/planning/resend-turnstile-setup.md). Checkout/commerce
 * (COMMERCE_ENABLED above) stays false — this only activates the
 * contact route, not ordering. */
export const CONTACT_FORM_ENABLED = true;
