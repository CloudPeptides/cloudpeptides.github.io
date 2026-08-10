/**
 * "Add Product / Peptide" wizard client logic. No framework — plain
 * DOM manipulation matching this codebase's established pattern
 * (cart-page.ts, admin-coa-form.ts, etc.). All server-side validation
 * happens again in src/pages/api/admin/products/index.ts regardless of
 * what this file does — this is UX, not the security boundary.
 */

interface Category {
  id: string;
  name: string;
}
interface CompoundOption {
  id: string;
  slug: string;
  name: string;
  display_name: string | null;
  entity_kind: string;
  status: string;
}
interface EntityKindOption {
  value: string;
  label: string;
}

const BLEND_LIKE_KINDS = new Set(['peptide_blend', 'stack']);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): T {
  let handle: ReturnType<typeof setTimeout> | null = null;
  return ((...args: Parameters<T>) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => fn(...args), ms);
  }) as T;
}

function init(): void {
  const formEl = document.getElementById('productWizard') as HTMLFormElement | null;
  if (!formEl) return;
  const form: HTMLFormElement = formEl;

  const categories: Category[] = JSON.parse(
    (document.getElementById('categoriesData') as HTMLInputElement).value,
  );
  const compounds: CompoundOption[] = JSON.parse(
    (document.getElementById('compoundsData') as HTMLInputElement).value,
  );
  const entityKinds: EntityKindOption[] = JSON.parse(
    (document.getElementById('entityKindsData') as HTMLInputElement).value,
  );

  const STEP_ORDER = ['1', '2', '3', '5', '6'];
  let currentStepIndex = 0;

  const stepSections = new Map<string, HTMLElement>();
  for (const step of STEP_ORDER) {
    const el = document.querySelector<HTMLElement>(`[data-wizard-step="${step}"]`);
    if (el) stepSections.set(step, el);
  }
  const stepLabels = new Map<string, HTMLElement>();
  document.querySelectorAll<HTMLElement>('[data-wizard-step-label]').forEach((el) => {
    const key = el.dataset.wizardStepLabel;
    if (key) stepLabels.set(key, el);
  });

  const backBtn = document.getElementById('wizardBackBtn') as HTMLButtonElement;
  const nextBtn = document.getElementById('wizardNextBtn') as HTMLButtonElement;
  const saveBtn = document.getElementById('wizardSaveBtn') as HTMLButtonElement;

  function currentStep(): string {
    return STEP_ORDER[currentStepIndex];
  }

  function showStep(step: string): void {
    for (const [key, el] of stepSections) el.hidden = key !== step;
    for (const [key, el] of stepLabels) {
      if (key === step) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    }
    backBtn.hidden = currentStepIndex === 0;
    const isLast = currentStepIndex === STEP_ORDER.length - 1;
    nextBtn.hidden = isLast;
    saveBtn.hidden = !isLast;
    if (step === '6') renderReview();
  }

  function stepIsRelevant(step: string): boolean {
    if (step !== '5') return true;
    // Blend/stack step only relevant for a blend/stack-kind compound,
    // and only when there IS a compound (new or linked) to attach
    // components to.
    const mode = researchMode();
    if (mode === 'none') return false;
    const kind = mode === 'link' ? linkedCompoundEntityKind() : entityKindSelect.value;
    return BLEND_LIKE_KINDS.has(kind ?? '');
  }

  function goNext(): void {
    if (!validateStep(currentStep())) return;
    let nextIndex = currentStepIndex + 1;
    while (nextIndex < STEP_ORDER.length && !stepIsRelevant(STEP_ORDER[nextIndex])) nextIndex++;
    currentStepIndex = Math.min(nextIndex, STEP_ORDER.length - 1);
    showStep(currentStep());
  }
  function goBack(): void {
    let prevIndex = currentStepIndex - 1;
    while (prevIndex > 0 && !stepIsRelevant(STEP_ORDER[prevIndex])) prevIndex--;
    currentStepIndex = Math.max(prevIndex, 0);
    showStep(currentStep());
  }

  nextBtn.addEventListener('click', goNext);
  backBtn.addEventListener('click', goBack);

  // --- Step 1: identity + duplicate check ---
  const canonicalNameInput = document.getElementById('canonicalName') as HTMLInputElement;
  const displayNameInput = document.getElementById('displayName') as HTMLInputElement;
  const slugInput = document.getElementById('slug') as HTMLInputElement;
  const entityKindSelect = document.getElementById('entityKind') as HTMLSelectElement;
  let slugManuallyEdited = false;
  slugInput.addEventListener('input', () => {
    slugManuallyEdited = true;
  });
  canonicalNameInput.addEventListener('input', () => {
    if (!slugManuallyEdited) slugInput.value = slugify(canonicalNameInput.value);
    runDuplicateCheck();
  });

  const aliasesList = document.getElementById('aliasesList') as HTMLElement;
  document.getElementById('addAliasBtn')!.addEventListener('click', () => addAliasRow());
  function addAliasRow(value = ''): void {
    const row = document.createElement('div');
    row.className = 'cp-admin-repeat-row';
    row.dataset.aliasRow = '';
    const input = document.createElement('input');
    input.maxLength = 100;
    input.value = value;
    input.setAttribute('aria-label', 'Alias');
    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'cp-admin-btn cp-admin-btn--danger cp-admin-btn--sm';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => row.remove());
    row.append(input, removeBtn);
    aliasesList.appendChild(row);
  }
  function getAliases(): string[] {
    return Array.from(aliasesList.querySelectorAll<HTMLInputElement>('input'))
      .map((i) => i.value.trim())
      .filter(Boolean);
  }

  const duplicateResults = document.getElementById('duplicateResults') as HTMLElement;
  const duplicateList = document.getElementById('duplicateList') as HTMLElement;
  const runDuplicateCheck = debounce(async () => {
    const q = canonicalNameInput.value.trim();
    if (q.length < 2) {
      duplicateResults.hidden = true;
      return;
    }
    try {
      const res = await fetch(`/api/admin/products/duplicate-check?q=${encodeURIComponent(q)}`);
      const result = (await res.json()) as { success: boolean; data?: CompoundOption[] };
      if (!result.success || !result.data || result.data.length === 0) {
        duplicateResults.hidden = true;
        return;
      }
      duplicateList.innerHTML = '';
      for (const c of result.data) {
        const li = document.createElement('li');
        li.textContent = `${c.display_name || c.name} — ${c.entity_kind.replace(/_/g, ' ')}, ${c.status} (matched "${(c as unknown as { matched_text: string }).matched_text}")`;
        duplicateList.appendChild(li);
      }
      duplicateResults.hidden = false;
    } catch {
      duplicateResults.hidden = true;
    }
  }, 400);

  // --- Step 2: research mode ---
  const linkExistingField = document.getElementById('linkExistingField') as HTMLElement;
  const existingCompoundSelect = document.getElementById(
    'existingCompoundSelect',
  ) as HTMLSelectElement;
  const researchPendingNote = document.getElementById('researchPendingNote') as HTMLElement;
  function researchMode(): 'new' | 'link' | 'none' {
    const checked = form.querySelector<HTMLInputElement>('input[name="researchMode"]:checked');
    return (checked?.value as 'new' | 'link' | 'none') ?? 'new';
  }
  function linkedCompoundEntityKind(): string | undefined {
    const opt = existingCompoundSelect.selectedOptions[0];
    return opt?.dataset.entityKind;
  }
  form.querySelectorAll<HTMLInputElement>('input[name="researchMode"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      const mode = researchMode();
      linkExistingField.hidden = mode !== 'link';
      researchPendingNote.hidden = mode === 'none';
    });
  });

  // --- Step 3: variants ---
  const variantsList = document.getElementById('variantsList') as HTMLElement;
  const variantTemplate = document.getElementById('variantTemplate') as HTMLTemplateElement;
  function addVariantRow(): void {
    const fragment = variantTemplate.content.cloneNode(true) as DocumentFragment;
    variantsList.appendChild(fragment);
    const rows = variantsList.querySelectorAll('[data-variant-row]');
    rows[rows.length - 1].querySelector('[data-remove-variant]')!.addEventListener('click', (e) => {
      (e.currentTarget as HTMLElement).closest('[data-variant-row]')!.remove();
    });
  }
  document.getElementById('addVariantBtn')!.addEventListener('click', addVariantRow);
  addVariantRow(); // start with one

  interface VariantData {
    code: string;
    name: string;
    spec: string;
    count: number;
    price: string;
    categoryId: string;
    internalStatus: string;
    publicStatus: string;
  }
  function getVariants(): VariantData[] {
    return Array.from(variantsList.querySelectorAll<HTMLElement>('[data-variant-row]')).map(
      (row) => ({
        code: (row.querySelector('[data-field="code"]') as HTMLInputElement).value.trim(),
        name: (row.querySelector('[data-field="name"]') as HTMLInputElement).value.trim(),
        spec: (row.querySelector('[data-field="spec"]') as HTMLInputElement).value.trim(),
        count: Number((row.querySelector('[data-field="count"]') as HTMLInputElement).value),
        price: (row.querySelector('[data-field="price"]') as HTMLInputElement).value.trim(),
        categoryId: (row.querySelector('[data-field="categoryId"]') as HTMLSelectElement).value,
        internalStatus: (row.querySelector('[data-field="internalStatus"]') as HTMLSelectElement)
          .value,
        publicStatus: (row.querySelector('[data-field="publicStatus"]') as HTMLSelectElement).value,
      }),
    );
  }

  // --- Step 5: blend/stack components ---
  const blendComponentsList = document.getElementById('blendComponentsList') as HTMLElement;
  function renderBlendComponents(): void {
    blendComponentsList.innerHTML = '';
    const excludeId = researchMode() === 'link' ? existingCompoundSelect.value : null;
    for (const c of compounds) {
      if (excludeId && c.id === excludeId) continue;
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = c.id;
      label.append(checkbox, ` ${c.display_name || c.name} (${c.entity_kind.replace(/_/g, ' ')})`);
      blendComponentsList.appendChild(label);
    }
  }
  function getStackComponentIds(): string[] {
    return Array.from(
      blendComponentsList.querySelectorAll<HTMLInputElement>('input[type="checkbox"]:checked'),
    ).map((i) => i.value);
  }

  // --- Step validation (client-side; server re-validates everything) ---
  function validateStep(step: string): boolean {
    if (step === '1') {
      if (!canonicalNameInput.value.trim() || !slugInput.value.trim() || !entityKindSelect.value) {
        canonicalNameInput.reportValidity();
        return false;
      }
    }
    if (step === '2' && researchMode() === 'link' && !existingCompoundSelect.value) {
      existingCompoundSelect.reportValidity();
      return false;
    }
    if (step === '3') {
      const variants = getVariants();
      if (variants.length === 0) return false;
      for (const v of variants) {
        if (!v.code || !v.name || !v.spec || !v.categoryId || !v.price || !(v.count > 0))
          return false;
      }
      const codes = new Set(variants.map((v) => v.code.toLowerCase()));
      if (codes.size !== variants.length) {
        showWizardError('Variant product codes must be unique.');
        return false;
      }
    }
    if (step === '5') renderBlendComponents();
    return true;
  }

  function showWizardError(message: string): void {
    const el = document.getElementById('wizardError') as HTMLElement;
    el.textContent = message;
    el.hidden = false;
  }

  // --- Step 6: review + save ---
  function renderReview(): void {
    const el = document.getElementById('reviewSummary') as HTMLElement;
    const mode = researchMode();
    const entityLabel =
      entityKinds.find((k) => k.value === entityKindSelect.value)?.label ?? entityKindSelect.value;
    const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;

    let researchHtml: string;
    if (mode === 'new') {
      researchHtml = `<dt>Research record</dt><dd>New draft compound "${canonicalNameInput.value}" (${entityLabel}), status: draft, private</dd>`;
    } else if (mode === 'link') {
      const opt = existingCompoundSelect.selectedOptions[0];
      researchHtml = `<dt>Research record</dt><dd>Linked to existing compound: ${opt?.textContent ?? ''}</dd>`;
    } else {
      researchHtml = `<dt>Research record</dt><dd>None — commerce-only product</dd>`;
    }

    const variants = getVariants();
    const variantsHtml = variants
      .map(
        (v) =>
          `<li>${v.code} — ${v.name}, ${v.spec}, ${v.count}× — $${v.price} (${categoryName(v.categoryId)}, ${v.internalStatus}, ${v.publicStatus})</li>`,
      )
      .join('');

    const componentIds = getStackComponentIds();
    const componentsHtml =
      componentIds.length > 0
        ? `<dt>Blend/stack components</dt><dd>${componentIds
            .map((id) => compounds.find((c) => c.id === id)?.name ?? id)
            .join(', ')}</dd>`
        : '';

    el.innerHTML = `<dl>${researchHtml}<dt>Shop products (${variants.length})</dt><dd><ul>${variantsHtml}</ul></dd>${componentsHtml}</dl>`;
  }

  saveBtn.addEventListener('click', async () => {
    const errorEl = document.getElementById('wizardError') as HTMLElement;
    const successEl = document.getElementById('wizardSuccess') as HTMLElement;
    errorEl.hidden = true;
    successEl.hidden = true;
    saveBtn.disabled = true;
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving…';

    const mode = researchMode();
    const payload = {
      compoundId: mode === 'link' ? existingCompoundSelect.value : null,
      newCompound:
        mode === 'new'
          ? {
              canonicalName: canonicalNameInput.value.trim(),
              displayName: displayNameInput.value.trim(),
              slug: slugInput.value.trim(),
              entityKind: entityKindSelect.value,
              aliases: getAliases(),
            }
          : null,
      stackComponentIds: getStackComponentIds(),
      variants: getVariants(),
    };

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = (await res.json()) as {
        success: boolean;
        error?: string;
        data?: { compoundId: string; productIds: string[] };
      };
      if (result.success && result.data) {
        form.hidden = true;
        successEl.innerHTML = `Product created successfully. <a href="/admin/compounds/${result.data.compoundId}">View research record</a> &middot; <a href="/admin/products">View products</a>`;
        successEl.hidden = false;
      } else {
        showWizardError(result.error || 'Could not save this product.');
      }
    } catch {
      showWizardError('Could not save this product. Please try again.');
    }

    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  });

  showStep(currentStep());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {};
