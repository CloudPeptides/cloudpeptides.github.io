# Legacy URL Redirect Map (prepared, NOT activated)

Generated programmatically from the real migration extraction (docs/migration/legacy-extraction.json) and the real shop catalog (src/lib/shop-products.ts) — every mapping below is a verified 1:1 correspondence, not a guess. **No redirect logic has been implemented or activated anywhere** (no _redirects file, no Cloudflare redirect rules, no astro.config redirects) — this is preparation only, per CLAUDE.md §9 (production cutover requires explicit approval).

## Research compound/stack pages (56)

Legacy `/{file}` → new `/research/compounds/{slug}` — deterministic (slug = filename minus .html, verified against the real migration, no renames).

| Legacy URL | New URL |
|---|---|
| /5-amino-1mq.html | /research/compounds/5-amino-1mq |
| /adamax.html | /research/compounds/adamax |
| /ahk-cu.html | /research/compounds/ahk-cu |
| /aicar.html | /research/compounds/aicar |
| /aod-9604.html | /research/compounds/aod-9604 |
| /ara-290.html | /research/compounds/ara-290 |
| /botulinum-toxin.html | /research/compounds/botulinum-toxin |
| /bpc-157.html | /research/compounds/bpc-157 |
| /bpc-157-tb-500.html | /research/compounds/bpc-157-tb-500 |
| /cagrilintide.html | /research/compounds/cagrilintide |
| /calm-focus-stack.html | /research/compounds/calm-focus-stack |
| /cartalax.html | /research/compounds/cartalax |
| /cerebrolysin.html | /research/compounds/cerebrolysin |
| /cjc-1295-dac.html | /research/compounds/cjc-1295-dac |
| /cjc-1295-no-dac.html | /research/compounds/cjc-1295-no-dac |
| /cjc-1295-no-dac-ipamorelin.html | /research/compounds/cjc-1295-no-dac-ipamorelin |
| /dsip.html | /research/compounds/dsip |
| /elite-anti-aging-stack.html | /research/compounds/elite-anti-aging-stack |
| /enhanced-sleep-stack.html | /research/compounds/enhanced-sleep-stack |
| /epithalon-compound.html | /research/compounds/epithalon-compound |
| /ghk-cu.html | /research/compounds/ghk-cu |
| /glow-blend.html | /research/compounds/glow-blend |
| /glutathione.html | /research/compounds/glutathione |
| /growth-hormone-fat-loss-stack.html | /research/compounds/growth-hormone-fat-loss-stack |
| /growth-hormone-muscle-building-stack.html | /research/compounds/growth-hormone-muscle-building-stack |
| /hcg.html | /research/compounds/hcg |
| /igf-1-lr3.html | /research/compounds/igf-1-lr3 |
| /ipamorelin.html | /research/compounds/ipamorelin |
| /kisspeptin-10.html | /research/compounds/kisspeptin-10 |
| /klow-blend.html | /research/compounds/klow-blend |
| /kpv.html | /research/compounds/kpv |
| /lemon-bottle.html | /research/compounds/lemon-bottle |
| /melanotan-i.html | /research/compounds/melanotan-i |
| /melanotan-ii.html | /research/compounds/melanotan-ii |
| /mots-c.html | /research/compounds/mots-c |
| /nad-plus.html | /research/compounds/nad-plus |
| /neuro-cognitive-stack.html | /research/compounds/neuro-cognitive-stack |
| /oxytocin-acetate.html | /research/compounds/oxytocin-acetate |
| /pe-22-28.html | /research/compounds/pe-22-28 |
| /pe-22-29.html | /research/compounds/pe-22-29 |
| /pinealon.html | /research/compounds/pinealon |
| /pt-141.html | /research/compounds/pt-141 |
| /retatrutide.html | /research/compounds/retatrutide |
| /selank.html | /research/compounds/selank |
| /semaglutide.html | /research/compounds/semaglutide |
| /semax.html | /research/compounds/semax |
| /sermorelin.html | /research/compounds/sermorelin |
| /ss-31.html | /research/compounds/ss-31 |
| /tb-500.html | /research/compounds/tb-500 |
| /tesamorelin.html | /research/compounds/tesamorelin |
| /thymalin-thymulin.html | /research/compounds/thymalin-thymulin |
| /thymosin-alpha-1.html | /research/compounds/thymosin-alpha-1 |
| /tirzepatide.html | /research/compounds/tirzepatide |
| /ultimate-fat-loss-stack.html | /research/compounds/ultimate-fat-loss-stack |
| /upgraded-glow-stack.html | /research/compounds/upgraded-glow-stack |
| /wolverine-stack.html | /research/compounds/wolverine-stack |

## Shop pages

| Legacy URL | New URL |
|---|---|
| /shop.html | /shop |
| /cart.html | /shop/cart |
| /product.html?id=ghk-cu | /shop/ghk-cu |
| /product.html?id=ahk-cu | /shop/ahk-cu |
| /product.html?id=bpc | /shop/bpc |
| /product.html?id=nad | /shop/nad |
| /product.html?id=tb500 | /shop/tb500 |
| /product.html?id=bpc-tb | /shop/bpc-tb |
| /product.html?id=glow | /shop/glow |
| /product.html?id=klow | /shop/klow |
| /product.html?id=kpv | /shop/kpv |
| /product.html?id=epithalon | /shop/epithalon |
| /product.html?id=mt-1 | /shop/mt-1 |
| /product.html?id=mt-2 | /shop/mt-2 |
| /product.html?id=glutathione | /shop/glutathione |
| /product.html?id=semaglutide | /shop/semaglutide |
| /product.html?id=tirz | /shop/tirz |
| /product.html?id=reta | /shop/reta |
| /product.html?id=mots-c | /shop/mots-c |
| /product.html?id=tesa | /shop/tesa |
| /product.html?id=ipamorelin | /shop/ipamorelin |
| /product.html?id=5-amino-1mq | /shop/5-amino-1mq |
| /product.html?id=igf-1-lr3 | /shop/igf-1-lr3 |
| /product.html?id=cjc-no-dac | /shop/cjc-no-dac |
| /product.html?id=cjc-no-dac-ipa | /shop/cjc-no-dac-ipa |
| /product.html?id=aod9604 | /shop/aod9604 |
| /product.html?id=aod9605 | /shop/aod9605 |
| /product.html?id=cagrilintide | /shop/cagrilintide |
| /product.html?id=sermorelin | /shop/sermorelin |
| /product.html?id=lemon-bottle | /shop/lemon-bottle |
| /product.html?id=aicar | /shop/aicar |
| /product.html?id=ara290 | /shop/ara290 |
| /product.html?id=dsip | /shop/dsip |
| /product.html?id=hcg | /shop/hcg |
| /product.html?id=kisspeptin-10 | /shop/kisspeptin-10 |
| /product.html?id=pt141 | /shop/pt141 |
| /product.html?id=selank | /shop/selank |
| /product.html?id=semax | /shop/semax |
| /product.html?id=ss-31 | /shop/ss-31 |
| /product.html?id=thymosin-alpha-1 | /shop/thymosin-alpha-1 |
| /product.html?id=adamax | /shop/adamax |
| /product.html?id=botulinum-toxin | /shop/botulinum-toxin |
| /product.html?id=pinealon | /shop/pinealon |
| /product.html?id=oxytocin-acetate | /shop/oxytocin-acetate |
| /product.html?id=pe-22-28 | /shop/pe-22-28 |
| /product.html?id=pe-22-29 | /shop/pe-22-29 |
| /product.html?id=thymalin-thymulin | /shop/thymalin-thymulin |
| /product.html?id=cartalax | /shop/cartalax |
| /product.html?id=cerebrolysin | /shop/cerebrolysin |

## Contact page

| Legacy URL | New URL |
|---|---|
| /contact.html | /contact |

## Homepage

| Legacy URL | New URL |
|---|---|
| /index.html | / |
| / | / |

## Not yet migrated (no rebuilt equivalent exists — do not redirect these until they are)

These pages have real content and traffic value but have not been rebuilt in the Astro app yet (out of scope for the Shop/Resend/SEO batch). Redirecting them now would send visitors to a 404. Leave them served by the legacy static site until each is genuinely rebuilt.

- /about.html
- /faq.html
- /research.html
- /compound-directory.html
- /stacks.html
- /aging-cellular-senescence.html
- /angiogenesis-vascular-biology.html
- /appetite-energy-balance.html
- /body-composition.html
- /cellular-energy.html
- /clinical-biomarkers.html
- /collagen-extracellular-matrix.html
- /connective-tissue-biology.html
- /cosmetic-regenerative-research.html
- /extracellular-matrix-remodeling.html
- /fat-metabolism.html
- /glucose-metabolism.html
- /hair-biology.html
- /inflammation-immune-response.html
- /metabolic-research.html
- /pigmentation-melanocytes.html
- /recovery-repair.html
- /skin-beauty.html
- /skin-biology-structure.html
- /tissue-repair-regeneration.html
- /wound-healing.html
