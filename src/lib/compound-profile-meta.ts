/**
 * Shared page-meta computation (title/description/breadcrumb JSON-LD)
 * for a compound profile — used by both the real public page
 * (src/pages/research/compounds/[slug].astro) and the admin preview
 * route (src/pages/admin/compounds/[id]/preview.astro, Research CMS
 * gap-fill, 2026-08-10: "Preview unpublished changes"), so the two
 * never drift out of sync. Kept as a plain function (not a component)
 * since BaseLayout's own props need these values directly, not a
 * rendered fragment.
 */
import type { CompoundWithRelations } from './database.types';

const ENTITY_LABELS: Record<string, string> = {
  peptide: 'Peptide',
  peptide_blend: 'Peptide blend',
  stack: 'Stack',
  small_molecule_drug: 'Small molecule',
  biologic: 'Biologic',
  supplement: 'Supplement',
  non_peptide_research_compound: 'Research compound',
};

export interface CompoundProfileMeta {
  displayName: string;
  description: string;
  breadcrumbJsonLd: Record<string, unknown>;
}

export function buildCompoundProfileMeta(
  compound: CompoundWithRelations,
  siteUrl: URL | undefined,
  profilePathPrefix: string,
): CompoundProfileMeta {
  const displayName = compound.display_name || compound.name;
  const description = `${displayName} research profile — ${ENTITY_LABELS[compound.entity_kind] ?? compound.entity_kind}${compound.category ? `, ${compound.category}` : ''}, with claim-level citations and evidence-type breakdown.`;
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: new URL('/', siteUrl).toString() },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Research',
        item: new URL('/research/compounds', siteUrl).toString(),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: displayName,
        item: new URL(`${profilePathPrefix}${compound.slug}`, siteUrl).toString(),
      },
    ],
  };
  return { displayName, description, breadcrumbJsonLd };
}
