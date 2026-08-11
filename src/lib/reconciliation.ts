/**
 * Parses the legacy-claim reconciliation marker that
 * scripts/enrichment/run-enrichment.mjs writes into a claim's
 * `quality_rationale` when reconciling a pre-existing legacy claim:
 *
 *   "[Reconciliation 2026-08-07, disposition: supported] <rationale text>"
 *
 * This is intentionally a presentation-layer concern, not a schema
 * change: the claims table has no dedicated "disposition" column (that
 * would have needed a reviewed migration for a fact the enrichment
 * pipeline already records in a stable, parseable format), so the
 * public-facing pages read the disposition back out of the text they
 * already have. A claim with no such prefix (every claim this project
 * authored fresh, never a pre-existing legacy statement) has no
 * disposition at all and is rendered normally.
 *
 * This module is the single place that decides how each disposition
 * affects PUBLIC DISPLAY — see docs/enrichment/full-coverage-report.md
 * for the full audit this reflects. The content-display rule this
 * exists to enforce: an unsupported/contradicted legacy claim must never
 * appear as if it were an established fact.
 *
 * 2026-08-11 addition: partitionClaimsByDisposition also strips the
 * retired Cloud Peptides site (see evidence.ts's isLegacySiteSource) out
 * of every claim's citation list before it ever renders, and reroutes
 * any claim that had a citation ONLY from that non-evidence source into
 * the same "not independently verified" bucket — a claim can't be shown
 * as ordinarily supported once its sole "source" is disqualified as not
 * being evidence at all (CLAUDE.md §6: every substantive claim needs a
 * traceable citation). Claims that never had any citation to begin with
 * are left exactly as they were; this only affects claims this specific
 * change would otherwise have made silently uncited.
 */
import type { Claim } from './database.types';
import { isLegacySiteSource } from './evidence';

export type ReconciliationDisposition =
  'supported' | 'revised' | 'unsupported' | 'contradicted' | 'superseded';

export interface ParsedReconciliation {
  disposition: ReconciliationDisposition;
  date: string;
  rationale: string;
}

const RECONCILIATION_PATTERN =
  /^\[Reconciliation (\d{4}-\d{2}-\d{2}), disposition: (\w+)\]\s*(.*)$/s;

export function parseReconciliation(qualityRationale: string | null): ParsedReconciliation | null {
  if (!qualityRationale) return null;
  const match = qualityRationale.match(RECONCILIATION_PATTERN);
  if (!match) return null;
  const [, date, disposition, rationale] = match;
  if (!isDisposition(disposition)) return null;
  return { disposition, date, rationale };
}

function isDisposition(value: string): value is ReconciliationDisposition {
  return (
    value === 'supported' ||
    value === 'revised' ||
    value === 'unsupported' ||
    value === 'contradicted' ||
    value === 'superseded'
  );
}

/**
 * Dispositions that must NEVER appear in a compound's normal claim
 * sections (Overview, Mechanism, Safety, etc.) — they may only appear in
 * a dedicated, clearly labeled "Unsupported legacy claims" block.
 * 'contradicted' is included defensively even though this project's own
 * audit corrected all 10 real instances to 'supported'/'revised' — if a
 * future reconciliation pass ever does classify something as genuinely
 * contradicted, this routing rule already covers it without a code change.
 */
const HIDDEN_FROM_NORMAL_FLOW: ReconciliationDisposition[] = ['unsupported', 'contradicted'];

export function isHiddenFromNormalFlow(claim: Pick<Claim, 'quality_rationale'>): boolean {
  const parsed = parseReconciliation(claim.quality_rationale);
  return parsed !== null && HIDDEN_FROM_NORMAL_FLOW.includes(parsed.disposition);
}

type WithSources = { claim_sources: { sources: { url: string } }[] };

/** Removes the retired legacy-site "source" from a claim's citation list
 * — real evidence citations are left untouched. */
export function sanitizeClaimSources<T extends WithSources['claim_sources'][number]>(
  claimSources: T[],
): T[] {
  return claimSources.filter((cs) => !isLegacySiteSource(cs.sources.url));
}

/** Splits a compound's claims into what renders in the normal claim
 * sections vs. what must be routed to the dedicated "not independently
 * verified" section — either because a reconciliation pass flagged it
 * unsupported/contradicted, or because stripping the non-evidence legacy
 * self-citation (see module doc above) left it with no real citation.
 * Every claim returned has its claim_sources already sanitized. Order is
 * preserved within each group. */
export function partitionClaimsByDisposition<
  T extends Pick<Claim, 'quality_rationale'> & WithSources,
>(claims: T[]): { visible: T[]; unsupported: T[] } {
  const visible: T[] = [];
  const unsupported: T[] = [];
  for (const claim of claims) {
    const sanitizedSources = sanitizeClaimSources(claim.claim_sources);
    const sanitized = { ...claim, claim_sources: sanitizedSources };
    const orphanedByLegacyStrip = claim.claim_sources.length > 0 && sanitizedSources.length === 0;
    if (isHiddenFromNormalFlow(claim) || orphanedByLegacyStrip) {
      unsupported.push(sanitized);
    } else {
      visible.push(sanitized);
    }
  }
  return { visible, unsupported };
}
