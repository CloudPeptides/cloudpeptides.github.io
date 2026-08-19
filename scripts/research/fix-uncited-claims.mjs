#!/usr/bin/env node
/**
 * Pre-publish fix: checkPublishReadiness (src/lib/admin/validation.ts)
 * blocks publishing while any claim has zero cited sources. 13 claims
 * across the 2026-08-19 batch are genuine "no evidence was located"
 * negative findings — statements that, by their nature, describe an
 * absence rather than support a positive assertion, so they were
 * written without a claim_sources link. This script attaches each one
 * to a real source ALREADY verified and cited elsewhere on the same
 * compound's profile (never a new/unverified source), with relationship
 * 'provides_context' (not 'directly_supports' — honest about what the
 * link actually represents: "this is the source whose absence of
 * relevant findings the claim is describing," not evidence for the
 * claim's content itself).
 *
 * Idempotent: skips any (claim_id, source_id) pair that already exists.
 * Run manually: node scripts/research/fix-uncited-claims.mjs
 */
import { getServiceClient } from './lib/import-helpers.mjs';

const FIXES = [
  {
    claimId: 'dca13706-c4a5-4dc5-9c59-8f0f9f6db56c',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/12030918/',
  }, // GHRP-2
  {
    claimId: 'aa21bcdc-e531-48ff-a1db-d32f4e510d58',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/7581965/',
  }, // GHRP-6
  {
    claimId: 'c1f247cc-1b71-48c0-a1ae-97b22a4a5c9f',
    sourceUrl: 'https://www.rxlist.com/factrel-drug.htm',
  }, // Gonadorelin
  {
    claimId: 'acaad773-c925-4245-b533-33e34dc8d702',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3795771/',
  }, // PEG-MGF
  {
    claimId: '481b4ce9-f661-4a3e-82f2-73e72178b3bc',
    sourceUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10719339/',
  }, // Mazdutide
  {
    claimId: '23a1cab0-fce1-4808-a6cf-065b0c3cc8ac',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/42253238/',
  }, // Survodutide
  {
    claimId: '4bc068bc-2755-4c51-ac47-19114dd91cc9',
    sourceUrl: 'https://www.nejm.org/doi/abs/10.1056/NEJMoa2502081',
  }, // CagriSema
  {
    claimId: 'de10a7d8-bbf9-40b6-a6fa-a8ce9ecb567e',
    sourceUrl: 'https://pubmed.ncbi.nlm.nih.gov/25041740/',
  }, // LL-37
  {
    claimId: '768302b1-e112-441d-8390-3e5202889509',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12193160/',
  }, // SNAP-8 faq
  {
    claimId: '8f8ac5ee-6468-4f24-9877-7679967878c7',
    sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12193160/',
  }, // SNAP-8 summary
  {
    claimId: '441a91b3-e6fd-4cc4-a686-484e76f646ea',
    sourceUrl: 'https://www.cell.com/cell/fulltext/S0092-8674(17)30293-3',
  }, // FOXO4-DRI
  {
    claimId: '0cc0ad01-5020-4824-be2e-a3ed0b829d02',
    sourceUrl: 'https://www.empiremedicaltraining.com/blog/what-are-mic-lipotropic-injections/',
  }, // Lipo-C summary
  {
    claimId: '68a45193-83e3-454b-8cf4-149c60e459e1',
    sourceUrl: 'https://www.empiremedicaltraining.com/blog/what-are-mic-lipotropic-injections/',
  }, // Lipo-C faq
];

const LOCATOR_NOTE =
  'Cited as the search basis for this absence-of-evidence statement, not as direct support for a positive claim.';

async function main() {
  const client = getServiceClient();
  for (const fix of FIXES) {
    const { data: source, error: sourceErr } = await client
      .from('sources')
      .select('id')
      .eq('url', fix.sourceUrl)
      .single();
    if (sourceErr || !source) {
      console.error(
        `FAILED: no source found for ${fix.sourceUrl} (claim ${fix.claimId}):`,
        sourceErr?.message,
      );
      continue;
    }
    const { data: existing } = await client
      .from('claim_sources')
      .select('claim_id')
      .eq('claim_id', fix.claimId)
      .eq('source_id', source.id)
      .maybeSingle();
    if (existing) {
      console.log(`already linked: claim ${fix.claimId} -> source ${source.id}`);
      continue;
    }
    const { error: insertErr } = await client.from('claim_sources').insert({
      claim_id: fix.claimId,
      source_id: source.id,
      relationship: 'provides_context',
      locator: LOCATOR_NOTE,
    });
    if (insertErr) {
      console.error(`FAILED to link claim ${fix.claimId}:`, insertErr.message);
    } else {
      console.log(`linked: claim ${fix.claimId} -> source ${source.id} (${fix.sourceUrl})`);
    }
  }
}

main();
