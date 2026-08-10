/**
 * Read-only duplicate check for the sources library (Research CMS
 * gap-fill, 2026-08-10) — "Detect duplicate DOI/PMID/URLs before
 * creation." Two independent checks, either or both may be queried in
 * one request:
 *   - ?url=<url> — exact match against sources.url (not DB-unique, so
 *     this is informational, not a hard block — different sources can
 *     legitimately reference the same base URL).
 *   - ?identifier_type=<t>&identifier_value=<v> — exact match against
 *     source_identifiers, which IS globally unique at the DB level
 *     (supabase/migrations/20260806144903_research_schema.sql's
 *     source_identifiers_globally_unique index) — a real match here
 *     means creation would fail outright regardless, so the client
 *     treats this one as a hard block.
 *
 * Contributor+ (same minimum role as every other read in this admin
 * area) — read-only, no service-role key, RLS still applies.
 */
export const prerender = false;

import type { APIRoute } from 'astro';
import { createUserScopedClient, hasMinRole } from '../../../../lib/auth';

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ url, locals }) => {
  const session = locals.session!;
  if (!hasMinRole(session.role, 'contributor')) {
    return json({ success: false, error: 'Admin access required.' }, 403);
  }

  const rawUrl = (url.searchParams.get('url') ?? '').trim();
  const identifierType = (url.searchParams.get('identifier_type') ?? '').trim();
  const identifierValue = (url.searchParams.get('identifier_value') ?? '').trim();

  const client = createUserScopedClient(session.accessToken);
  const matches: Array<{
    id: string;
    title: string;
    matched_on: 'url' | 'identifier';
    matched_text: string;
    hard_block: boolean;
  }> = [];

  if (rawUrl) {
    const { data } = await client
      .from('sources')
      .select('id, title, url')
      .eq('url', rawUrl)
      .limit(5);
    for (const row of data ?? []) {
      matches.push({
        id: row.id,
        title: row.title,
        matched_on: 'url',
        matched_text: row.url,
        hard_block: false,
      });
    }
  }

  if (identifierType && identifierValue) {
    const { data } = await client
      .from('source_identifiers')
      .select('identifier_type, identifier_value, sources ( id, title )')
      .eq('identifier_type', identifierType)
      .eq('identifier_value', identifierValue)
      .limit(5);
    for (const row of (data ?? []) as unknown as Array<{
      identifier_type: string;
      identifier_value: string;
      sources: { id: string; title: string } | null;
    }>) {
      if (!row.sources) continue;
      matches.push({
        id: row.sources.id,
        title: row.sources.title,
        matched_on: 'identifier',
        matched_text: `${row.identifier_type.toUpperCase()}: ${row.identifier_value}`,
        hard_block: true,
      });
    }
  }

  return json({ success: true, data: matches }, 200);
};
