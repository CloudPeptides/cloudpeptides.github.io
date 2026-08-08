/**
 * Private admin pricing catalog — staging-only internal reference.
 *
 * NOT the public shop catalog (src/lib/shop-products.ts, live on
 * production, wired to the real cart/checkout/order-request flow).
 * This is a separate, read-only, admin-authenticated reference table
 * with no checkout/payment/public-ordering wiring of any kind, and no
 * public API exposes it. src/pages/admin/pricing-catalog.astro adds a
 * second, defense-in-depth guard (blocks rendering on the indexable/
 * production host) on top of the procedural one (this feature is never
 * merged past rebuild/astro-platform until explicitly approved).
 *
 * Sourced from a pricing table supplied 2026-08-08, reconciled by
 * product code (never display name) against the 87 existing option
 * codes in shop-products.ts — every code below already exists there;
 * nothing here was "added" as a new product. See the dry-run report
 * delivered in-chat for the full products-matched/changed/ambiguous
 * breakdown.
 *
 * Every `price` value below is the already-computed customer-facing
 * price (cost + $45, per explicit instruction) — the source table's
 * COST column itself is never stored, logged, or referenced anywhere
 * in this codebase. tests/unit/pricing-catalog.test.ts asserts
 * programmatically that no entry here ever carries a `cost`-shaped
 * key, as a permanent guard against that changing by accident.
 *
 * Resolved ambiguities (all confirmed in-chat, none guessed):
 *  - Lemon Bottle had no product code in the source table — confirmed
 *    to be the existing LEM code, not assumed.
 *  - "sema" / "tz" / "r3t@" (source table's own abbreviated/obfuscated
 *    names) are shown here under the existing public-catalog display
 *    names (Semaglutide / Tirz / Reta) — confirmed choice, not assumed.
 *  - AOD9604 (5AD) / AOD9605 (10AD) and PE-22-28 (PE-5) / PE-22-29
 *    (PE-10): code, name, and spec all matched the existing separate
 *    SKUs cleanly with no internal contradiction found in the source
 *    table itself — kept as fully separate entries, never merged or
 *    aliased (consistent with the existing research-side rule that
 *    AOD9605 is identity_confidence: unverified and must never be
 *    silently aliased to AOD9604). Flagged in the dry-run report per
 *    instruction rather than silently resolved.
 */

export interface PricingCatalogEntry {
  code: string;
  name: string;
  spec: string;
  count: number;
  price: number;
  category: string;
}

export const PRICING_CATALOG: PricingCatalogEntry[] = [
  // --- Beauty + Repair ---
  { code: 'CU50', name: 'GHK-CU', spec: '50mg', count: 10, price: 77, category: 'Beauty + Repair' },
  {
    code: 'CU100',
    name: 'GHK-CU',
    spec: '100mg',
    count: 10,
    price: 105,
    category: 'Beauty + Repair',
  },
  { code: 'AU50', name: 'AHK-CU', spec: '50mg', count: 10, price: 85, category: 'Beauty + Repair' },
  { code: 'BC5', name: 'BPC', spec: '5mg', count: 10, price: 85, category: 'Beauty + Repair' },
  { code: 'BC10', name: 'BPC', spec: '10mg', count: 10, price: 120, category: 'Beauty + Repair' },
  {
    code: 'NJ500',
    name: 'NAD+',
    spec: '500mg',
    count: 10,
    price: 115,
    category: 'Beauty + Repair',
  },
  {
    code: 'NJ1000',
    name: 'NAD+',
    spec: '1000mg',
    count: 10,
    price: 140,
    category: 'Beauty + Repair',
  },
  { code: 'TB5', name: 'TB500', spec: '5mg', count: 10, price: 135, category: 'Beauty + Repair' },
  { code: 'TB10', name: 'TB500', spec: '10mg', count: 10, price: 195, category: 'Beauty + Repair' },
  {
    code: 'BB10',
    name: 'BPC + TB',
    spec: '5mg/5mg',
    count: 10,
    price: 160,
    category: 'Beauty + Repair',
  },
  {
    code: 'BB20',
    name: 'BPC + TB',
    spec: '10mg/10mg',
    count: 10,
    price: 235,
    category: 'Beauty + Repair',
  },
  {
    code: 'BB30',
    name: 'BPC + TB',
    spec: '15mg/15mg',
    count: 10,
    price: 325,
    category: 'Beauty + Repair',
  },
  { code: 'GLOW', name: 'GLOW', spec: '70mg', count: 10, price: 215, category: 'Beauty + Repair' },
  { code: 'KLOW', name: 'KLOW', spec: '80mg', count: 10, price: 225, category: 'Beauty + Repair' },
  { code: 'KP5', name: 'KPV', spec: '5mg', count: 10, price: 90, category: 'Beauty + Repair' },
  { code: 'KP10', name: 'KPV', spec: '10mg', count: 10, price: 105, category: 'Beauty + Repair' },
  {
    code: 'ET10',
    name: 'Epithalon',
    spec: '10mg',
    count: 10,
    price: 90,
    category: 'Beauty + Repair',
  },
  {
    code: 'ET50',
    name: 'Epithalon',
    spec: '50mg',
    count: 10,
    price: 195,
    category: 'Beauty + Repair',
  },
  { code: 'MT10', name: 'MT-1', spec: '10mg', count: 10, price: 110, category: 'Beauty + Repair' },
  { code: 'ML10', name: 'MT-2', spec: '10mg', count: 10, price: 110, category: 'Beauty + Repair' },
  {
    code: 'GTT600',
    name: 'Glutathione',
    spec: '600mg',
    count: 10,
    price: 115,
    category: 'Beauty + Repair',
  },
  {
    code: 'GTT1500',
    name: 'Glutathione',
    spec: '1500mg',
    count: 10,
    price: 135,
    category: 'Beauty + Repair',
  },

  // --- Weight Loss + Metabolic ---
  {
    code: 'SM10',
    name: 'Semaglutide',
    spec: '10mg',
    count: 10,
    price: 100,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'SM20',
    name: 'Semaglutide',
    spec: '20mg',
    count: 10,
    price: 140,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TR10',
    name: 'Tirz',
    spec: '10mg',
    count: 10,
    price: 105,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TR15',
    name: 'Tirz',
    spec: '15mg',
    count: 10,
    price: 115,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TR20',
    name: 'Tirz',
    spec: '20mg',
    count: 10,
    price: 140,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TR30',
    name: 'Tirz',
    spec: '30mg',
    count: 10,
    price: 175,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TR40',
    name: 'Tirz',
    spec: '40mg',
    count: 10,
    price: 210,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TR60',
    name: 'Tirz',
    spec: '60mg',
    count: 10,
    price: 275,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'RT5',
    name: 'Reta',
    spec: '5mg',
    count: 10,
    price: 125,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'RT10',
    name: 'Reta',
    spec: '10mg',
    count: 10,
    price: 165,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'RT15',
    name: 'Reta',
    spec: '15mg',
    count: 10,
    price: 185,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'RT20',
    name: 'Reta',
    spec: '20mg',
    count: 10,
    price: 225,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'RT30',
    name: 'Reta',
    spec: '30mg',
    count: 10,
    price: 245,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'RT40',
    name: 'Reta',
    spec: '40mg',
    count: 10,
    price: 275,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'RT60',
    name: 'Reta',
    spec: '60mg',
    count: 10,
    price: 335,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'MS10',
    name: 'MOTS-C',
    spec: '10mg',
    count: 10,
    price: 120,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'MS20',
    name: 'MOTS-C',
    spec: '20mg',
    count: 10,
    price: 180,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'MS40',
    name: 'MOTS-C',
    spec: '40mg',
    count: 10,
    price: 265,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TSM5',
    name: 'Tesa',
    spec: '5mg',
    count: 10,
    price: 145,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TSM10',
    name: 'Tesa',
    spec: '10mg',
    count: 10,
    price: 215,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'TSM20',
    name: 'Tesa',
    spec: '20mg',
    count: 10,
    price: 345,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'IP5',
    name: 'Ipamorelin',
    spec: '5mg',
    count: 10,
    price: 84,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'IP10',
    name: 'Ipamorelin',
    spec: '10mg',
    count: 10,
    price: 110,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: '10AM',
    name: '5-Amino-1MQ',
    spec: '10mg',
    count: 10,
    price: 90,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: '50AM',
    name: '5-Amino-1MQ',
    spec: '50mg',
    count: 10,
    price: 130,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'IF1',
    name: 'IGF-1 LR3',
    spec: '1mg',
    count: 10,
    price: 275,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'CND5',
    name: 'CJC no DAC',
    spec: '5mg',
    count: 10,
    price: 135,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'CND10',
    name: 'CJC no DAC',
    spec: '10mg',
    count: 10,
    price: 185,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'CP10',
    name: 'CJC no DAC + IPA',
    spec: '10mg',
    count: 10,
    price: 155,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: '5AD',
    name: 'AOD9604',
    spec: '5mg',
    count: 10,
    price: 145,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: '10AD',
    name: 'AOD9605',
    spec: '10mg',
    count: 10,
    price: 210,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'CGL5',
    name: 'Cagrilintide',
    spec: '5mg',
    count: 10,
    price: 175,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'CGL10',
    name: 'Cagrilintide',
    spec: '10mg',
    count: 10,
    price: 240,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'SML5',
    name: 'Sermorelin',
    spec: '5mg',
    count: 10,
    price: 120,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'SML10',
    name: 'Sermorelin',
    spec: '10mg',
    count: 10,
    price: 190,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'LEM',
    name: 'Lemon Bottle',
    spec: '10ml',
    count: 10,
    price: 110,
    category: 'Weight Loss + Metabolic',
  },
  {
    code: 'AR100',
    name: 'Aicar',
    spec: '100mg',
    count: 10,
    price: 160,
    category: 'Weight Loss + Metabolic',
  },

  // --- Repair + Other ---
  {
    code: 'ARA10',
    name: 'ARA290',
    spec: '10mg',
    count: 10,
    price: 115,
    category: 'Repair + Other',
  },
  { code: 'DS5', name: 'DSIP', spec: '5mg', count: 10, price: 90, category: 'Repair + Other' },
  { code: 'DS10', name: 'DSIP', spec: '10mg', count: 10, price: 120, category: 'Repair + Other' },
  { code: 'G2K', name: 'HCG', spec: '2000iu', count: 10, price: 90, category: 'Repair + Other' },
  { code: 'G5K', name: 'HCG', spec: '5000iu', count: 10, price: 125, category: 'Repair + Other' },
  { code: 'G10K', name: 'HCG', spec: '10000iu', count: 10, price: 185, category: 'Repair + Other' },
  {
    code: 'KS5',
    name: 'Kisspeptin-10',
    spec: '5mg',
    count: 10,
    price: 95,
    category: 'Repair + Other',
  },
  {
    code: 'KS10',
    name: 'Kisspeptin-10',
    spec: '10mg',
    count: 10,
    price: 125,
    category: 'Repair + Other',
  },
  { code: 'P41', name: 'PT141', spec: '10mg', count: 10, price: 105, category: 'Repair + Other' },
  { code: 'SK5', name: 'Selank', spec: '5mg', count: 10, price: 90, category: 'Repair + Other' },
  { code: 'SK10', name: 'Selank', spec: '10mg', count: 10, price: 115, category: 'Repair + Other' },
  { code: 'SX5', name: 'Semax', spec: '5mg', count: 10, price: 90, category: 'Repair + Other' },
  { code: 'SX10', name: 'Semax', spec: '10mg', count: 10, price: 115, category: 'Repair + Other' },
  { code: '2S10', name: 'SS-31', spec: '10mg', count: 10, price: 145, category: 'Repair + Other' },
  { code: '2S50', name: 'SS-31', spec: '50mg', count: 10, price: 365, category: 'Repair + Other' },
  {
    code: 'TA5',
    name: 'Thymosin Alpha 1',
    spec: '5mg',
    count: 10,
    price: 150,
    category: 'Repair + Other',
  },
  {
    code: 'TA10',
    name: 'Thymosin Alpha 1',
    spec: '10mg',
    count: 10,
    price: 210,
    category: 'Repair + Other',
  },
  { code: 'ADA5', name: 'Adamax', spec: '5mg', count: 10, price: 135, category: 'Repair + Other' },
  {
    code: 'ADA10',
    name: 'Adamax',
    spec: '10mg',
    count: 10,
    price: 180,
    category: 'Repair + Other',
  },
  {
    code: 'XT100',
    name: 'Botulinum Toxin',
    spec: '100iu',
    count: 1,
    price: 135,
    category: 'Repair + Other',
  },
  {
    code: 'Pin10',
    name: 'Pinealon',
    spec: '10mg',
    count: 10,
    price: 105,
    category: 'Repair + Other',
  },
  {
    code: 'OT5',
    name: 'Oxytocin Acetate',
    spec: '5mg',
    count: 10,
    price: 90,
    category: 'Repair + Other',
  },
  {
    code: 'OT10',
    name: 'Oxytocin Acetate',
    spec: '10mg',
    count: 10,
    price: 115,
    category: 'Repair + Other',
  },
  { code: 'PE-5', name: 'PE-22-28', spec: '5mg', count: 10, price: 95, category: 'Repair + Other' },
  {
    code: 'PE-10',
    name: 'PE-22-29',
    spec: '10mg',
    count: 10,
    price: 125,
    category: 'Repair + Other',
  },
  {
    code: 'TY10',
    name: 'Thymalin/Thymulin',
    spec: '10mg',
    count: 10,
    price: 109,
    category: 'Repair + Other',
  },
  {
    code: 'Cart20',
    name: 'Cartalax',
    spec: '20mg',
    count: 10,
    price: 145,
    category: 'Repair + Other',
  },
  {
    code: 'CBL60',
    name: 'Cerebrolysin',
    spec: '60mg',
    count: 10,
    price: 115,
    category: 'Repair + Other',
  },
];

export const PRICING_CATALOG_CATEGORIES = [
  'Beauty + Repair',
  'Weight Loss + Metabolic',
  'Repair + Other',
] as const;

/** True when a kit is the standard 10-vial size — drives the "10-vial
 * kit" label the entries above should always show for count === 10
 * (XT100 is the one documented exception, count 1). */
export function isTenVialKit(count: number): boolean {
  return count === 10;
}
