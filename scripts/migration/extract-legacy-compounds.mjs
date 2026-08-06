#!/usr/bin/env node
/**
 * Phase 2 migration — parse every page in legacy-site/ and produce a
 * dry-run extraction (compounds + draft claims + provenance sources) as
 * JSON, plus a human-readable import report. Writes NO data to any
 * database — see import-to-supabase.mjs for the actual insert step.
 *
 * Classification rule (verified against every legacy page, not assumed):
 * a page is an individual "compound" if its breadcrumb trail's second-
 * to-last link is compound-directory.html, a "stack"/blend if it's
 * stacks.html. Everything else (topic/chapter pages, category hub pages,
 * site infrastructure) is explicitly excluded and reported as such —
 * never silently dropped.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { load } from 'cheerio';

const LEGACY_DIR = new URL('../../legacy-site/', import.meta.url);
const OUT_DIR = new URL('../../docs/migration/', import.meta.url);

const INFRASTRUCTURE_PAGES = new Set([
  'index.html',
  'about.html',
  'cart.html',
  'compound-directory.html',
  'contact.html',
  'faq.html',
  'product.html',
  'research.html',
  'shop.html',
  'stacks.html',
]);

const SECTION_LABEL_MAP = {
  'research overview': 'summary',
  overview: 'summary',
  'mechanism of action': 'mechanism',
  'scientific rationale': 'mechanism',
  'frequently asked questions': 'faq',
  'educational faq': 'faq',
  'research disclaimer': 'safety',
};

const KNOWN_BLEND_NAMES = new Set(['glow-blend.html', 'klow-blend.html']);
// Known non-peptide compound-directory entries — flagged with high
// confidence from their common/well-established names rather than
// guessed; anything not covered here is left null and flagged for human
// classification instead of defaulted with false confidence.
const ENTITY_KIND_OVERRIDES = {
  'botulinum-toxin.html': 'biologic',
  'hcg.html': 'biologic',
  'lemon-bottle.html': 'supplement',
};

function slugify(filename) {
  return filename.replace(/\.html$/, '');
}

function textOf($el) {
  return $el.text().replace(/\s+/g, ' ').trim();
}

function classify($, filename) {
  if (INFRASTRUCTURE_PAGES.has(filename)) {
    return {
      type: 'excluded',
      reason: 'site infrastructure page (nav/shop/home/etc.), not a compound',
    };
  }
  const title = textOf($('title'));
  const looksLikeCompoundTitle = /Cloud Peptides Research Library\s*$/.test(title);
  const crumbs = $('.breadcrumbs a')
    .map((_, a) => $(a).attr('href'))
    .get();
  if (crumbs.length === 0) {
    if (looksLikeCompoundTitle) {
      // Title pattern matches every real compound/stack page exactly
      // ("<Name> | Cloud Peptides Research Library"), but this page has
      // none of the expected structure (breadcrumb, hero, sections) —
      // a stub/placeholder that was never built out, not a hub page.
      // Verified against every other legacy page: this signature is
      // unique to semax.html, not a pattern-matching false positive.
      return { type: 'compound', stub: true };
    }
    return {
      type: 'excluded',
      reason:
        'no breadcrumb trail found — category hub or non-standard page, not an individual compound',
    };
  }
  const parent = crumbs[crumbs.length - 1];
  if (parent === 'compound-directory.html') return { type: 'compound' };
  if (parent === 'stacks.html') return { type: 'stack' };
  return {
    type: 'excluded',
    reason: `breadcrumb parent is "${parent}" — a topic/chapter page under a category hub, not an individual compound`,
  };
}

function extractQuickfacts($) {
  const facts = {};
  $('.quickfacts')
    .first()
    .find('.fact')
    .each((_, el) => {
      const label = textOf($(el).find('h4').first());
      const value = textOf($(el).find('strong').first());
      if (label) facts[label] = value;
    });
  return facts;
}

function extractTags($, heading) {
  const tags = [];
  $('.section-label').each((_, labelEl) => {
    if (textOf($(labelEl)) !== heading) return;
    $(labelEl)
      .parent()
      .find('.snapshot-item')
      .each((_, item) => {
        tags.push(textOf($(item)).replace(/^✓\s*/, ''));
      });
  });
  return tags;
}

function extractSections($) {
  const sections = [];
  $('.collection').each((_, collectionEl) => {
    const $collection = $(collectionEl);
    const label = textOf($collection.find('.section-label').first());
    const heading = textOf($collection.find('h2').first());
    // Paragraphs that are direct prose (not inside a nested .snapshot or
    // .quickfacts tag block, and not FAQ answers — a <p> immediately
    // preceded by an <h3> is an FAQ answer, handled separately below so
    // it isn't extracted twice).
    const paragraphs = [];
    $collection.children('p').each((_, p) => {
      const prev = $(p).prev();
      if (prev.length && prev.is('h3')) return;
      const t = textOf($(p));
      if (t) paragraphs.push(t);
    });
    // FAQ-style h3/p pairs.
    const faqPairs = [];
    $collection.children('h3').each((_, h3El) => {
      const question = textOf($(h3El));
      const answer = textOf($(h3El).next('p'));
      if (question && answer) faqPairs.push({ question, answer });
    });
    sections.push({ label, heading, paragraphs, faqPairs });
  });
  return sections;
}

function extractRelated($, sectionLabels) {
  const links = [];
  $('.section-label').each((_, labelEl) => {
    if (!sectionLabels.includes(textOf($(labelEl)))) return;
    $(labelEl)
      .parent()
      .find('.related a, .compounds span')
      .each((_, a) => {
        const text = textOf($(a));
        const href = $(a).attr('href');
        if (text) links.push({ text, href: href && href !== '#' ? href : null });
      });
  });
  return links;
}

function parsePage(filename) {
  const html = readFileSync(new URL(filename, LEGACY_DIR), 'utf8');
  const $ = load(html);
  const classification = classify($, filename);

  const result = {
    filename,
    slug: slugify(filename),
    title: textOf($('title')),
    classification,
  };

  if (classification.type === 'excluded') {
    return result;
  }

  result.name = textOf($('.research-hero h1').first()) || textOf($('h1').first());
  result.description = textOf($('.research-hero p').first());
  result.quickfacts = extractQuickfacts($);
  result.snapshotTags = extractTags($, 'Research Snapshot');
  result.currentResearchTags = [
    ...extractTags($, 'Current Research'),
    ...extractTags($, 'Research Topics'),
  ];
  result.sections = extractSections($);
  result.relatedLinks = extractRelated($, [
    'Frequently Studied With',
    'Related Compounds',
    'Related Topics',
    'Related Research',
  ]);
  result.externalResourceLinks = $('.external-links a.external')
    .map((_, a) => ({ text: textOf($(a).find('h3').first()), href: $(a).attr('href') }))
    .get();

  if (classification.type === 'stack') {
    result.componentSpans = $('.section-label')
      .filter((_, el) => /Key Compounds/i.test(textOf($(el))))
      .parent()
      .find('.compounds span')
      .map((_, s) => textOf($(s)))
      .get();
  }

  return result;
}

function warningsFor(page) {
  const warnings = [];
  if (page.classification.type === 'excluded') return warnings;
  if (page.classification.stub) {
    warnings.push(
      'STUB PAGE: legacy-site file is a placeholder with no real content ("...runtime reset. Replace with the full template if desired.") — title confirms this was meant to be a real compound page, but no scientific content exists anywhere in the legacy site to migrate. Must not be silently dropped; needs an editor to write real content from scratch.',
    );
  }
  if (!page.name) warnings.push('no <h1>/.research-hero h1 found — name is empty');
  const proseParagraphCount = page.sections.reduce((n, s) => n + s.paragraphs.length, 0);
  const faqCount = page.sections.reduce((n, s) => n + s.faqPairs.length, 0);
  if (proseParagraphCount === 0 && faqCount === 0) {
    warnings.push(
      'no extractable prose paragraphs or FAQ content found — likely a placeholder/stub page (see raw HTML)',
    );
  }
  if (
    page.classification.type === 'compound' &&
    !page.quickfacts['Peptide Class'] &&
    !ENTITY_KIND_OVERRIDES[page.filename]
  ) {
    warnings.push(
      'no "Peptide Class" quickfact and no known override — entity_kind cannot be confidently assigned, needs human classification',
    );
  }
  if (
    page.classification.type === 'stack' &&
    (!page.componentSpans || page.componentSpans.length === 0)
  ) {
    warnings.push(
      'stack page but no component compounds could be identified from the "Key Compounds" section',
    );
  }
  return warnings;
}

function entityKindFor(page) {
  if (page.classification.type === 'stack') return 'stack';
  if (ENTITY_KIND_OVERRIDES[page.filename]) return ENTITY_KIND_OVERRIDES[page.filename];
  if (KNOWN_BLEND_NAMES.has(page.filename)) return 'peptide_blend';
  if (page.quickfacts?.['Peptide Class']) return 'peptide';
  return null; // Deliberately left unclassified — flagged for human review, never guessed.
}

function buildClaims(page, sourceId) {
  const claims = [];
  let order = 0;
  for (const section of page.sections) {
    const key = (section.label || section.heading || '').toLowerCase().trim();
    const contentSection = SECTION_LABEL_MAP[key];
    if (contentSection) {
      for (const p of section.paragraphs) {
        claims.push({
          content_section: contentSection,
          statement: p,
          display_order: order++,
          source_ref: sourceId,
        });
      }
      for (const { question, answer } of section.faqPairs) {
        claims.push({
          content_section: 'faq',
          statement: `Q: ${question} A: ${answer}`,
          display_order: order++,
          source_ref: sourceId,
        });
      }
    }
  }
  return claims;
}

function main() {
  const files = readdirSync(LEGACY_DIR).filter((f) => f.endsWith('.html'));
  const pages = files.map(parsePage).sort((a, b) => a.filename.localeCompare(b.filename));

  const compounds = [];
  const excluded = [];
  const importItems = [];

  for (const page of pages) {
    if (page.classification.type === 'excluded') {
      excluded.push(page);
      continue;
    }
    const warnings = warningsFor(page);
    const entity_kind = entityKindFor(page);
    if (!entity_kind)
      warnings.push(
        'entity_kind is null — will NOT be imported until a human assigns one (see warnings)',
      );

    const sourceRef = `legacy:${page.filename}`;
    const claims = buildClaims(page, sourceRef);
    if (claims.length === 0) warnings.push('zero claims extracted from this page');

    const item = {
      filename: page.filename,
      slug: page.slug,
      name: page.name,
      entity_kind,
      category: page.quickfacts?.['Category'] || null,
      description: page.description,
      claims,
      stack_component_names: page.componentSpans || null,
      raw_import_metadata: {
        quickfacts: page.quickfacts,
        snapshot_tags: page.snapshotTags,
        current_research_tags: page.currentResearchTags,
        related_links: page.relatedLinks,
        external_resource_links: page.externalResourceLinks,
      },
      source: {
        ref: sourceRef,
        source_type: 'other',
        title: `Cloud Peptides legacy page — ${page.title || page.name}`,
        url: `https://cloudpeptides.github.io/${page.filename}`,
      },
      warnings,
      importable: entity_kind !== null && claims.length > 0,
    };
    compounds.push(item);
    importItems.push(item);
  }

  writeFileSync(
    new URL('legacy-extraction.json', OUT_DIR),
    JSON.stringify({ compounds, excluded }, null, 2),
  );

  const totalPages = pages.length;
  const stackCount = pages.filter((p) => p.classification?.type === 'stack').length;
  const importableCount = compounds.filter((c) => c.importable).length;
  const needsReviewCount = compounds.filter((c) => !c.importable).length;

  let report = `# Legacy Compound Import Report (dry run)\n\n`;
  report += `Generated by \`scripts/migration/extract-legacy-compounds.mjs\`. No database writes — this is the extraction preview.\n\n`;
  report += `**Totals:** ${totalPages} legacy HTML pages scanned · ${compounds.length} classified as compound/stack (${stackCount} stacks) · ${excluded.length} explicitly excluded (not compounds) · ${importableCount} ready to import as drafts · ${needsReviewCount} need human review before import.\n\n`;

  report += `## Ready to import (${importableCount})\n\n`;
  report += `| Slug | Name | entity_kind | Claims |\n|---|---|---|---|\n`;
  for (const c of compounds.filter((c) => c.importable)) {
    report += `| ${c.slug} | ${c.name} | ${c.entity_kind} | ${c.claims.length} |\n`;
  }

  report += `\n## Needs human review before import (${needsReviewCount})\n\n`;
  report += `| Slug | Name | Warnings |\n|---|---|---|\n`;
  for (const c of compounds.filter((c) => !c.importable)) {
    report += `| ${c.slug} | ${c.name || '(none found)'} | ${c.warnings.join('; ')} |\n`;
  }

  report += `\n## Explicitly excluded — not individual compounds (${excluded.length})\n\n`;
  report += `| File | Reason |\n|---|---|\n`;
  for (const p of excluded) {
    report += `| ${p.filename} | ${p.classification.reason} |\n`;
  }

  report += `\n## All classified pages — warnings, even where still importable (for editor awareness)\n\n`;
  for (const c of compounds) {
    if (c.warnings.length) report += `- **${c.slug}**: ${c.warnings.join('; ')}\n`;
  }

  writeFileSync(new URL('legacy-compound-import-report.md', OUT_DIR), report);

  console.log(`Scanned ${totalPages} pages.`);
  console.log(
    `Compounds/stacks classified: ${compounds.length} (${importableCount} importable, ${needsReviewCount} need review).`,
  );
  console.log(`Excluded (not compounds): ${excluded.length}.`);
  console.log(`Wrote docs/migration/legacy-extraction.json and legacy-compound-import-report.md`);
}

main();
