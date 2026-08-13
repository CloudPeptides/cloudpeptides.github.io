/**
 * Single source of truth for the Researcher Certification text and the
 * four version strings that get stamped onto every
 * researcher_attestations row (src/pages/api/account/register.ts,
 * certify.ts). Bumping any constant here means every researcher whose
 * latest attestation predates it will be redirected to /certify on
 * their next protected-page load (src/middleware.ts's needsCertification
 * check) — never edit the certification text in place without deciding
 * whether that's actually a material change requiring recertification;
 * if it is, bump CURRENT_CERTIFICATION_VERSION alongside it.
 *
 * Date-based versions (YYYY-MM-DD) rather than semver — there is no
 * meaningful "patch vs. major" distinction for a legal/certification
 * document; the date a version was approved is simpler and just as
 * unambiguous as an ordering key.
 */

export const CURRENT_CERTIFICATION_VERSION = '2026-08-13';
export const CURRENT_TERMS_VERSION = '2026-08-13';
export const CURRENT_PRIVACY_VERSION = '2026-08-13';
export const CURRENT_RESEARCH_USE_POLICY_VERSION = '2026-08-13';

export const RESEARCHER_CERTIFICATION_HEADING = 'Researcher Certification';

export const RESEARCHER_CERTIFICATION_TEXT = [
  'I certify that I am an independent researcher or an authorized representative of a legitimate research organization and that I am accessing Cloud Peptides solely for lawful educational or non-clinical laboratory research purposes.',
  'I understand that the information available through this website is provided solely for educational and scientific research purposes. It is not medical advice, prescribing information, treatment guidance, or a substitute for consultation with a qualified healthcare professional.',
  'I understand that all materials offered through the Cloud Peptides shop are intended exclusively for legitimate, non-clinical laboratory research. They are not intended for human or veterinary consumption, administration, therapeutic use, diagnostic use, food use, cosmetic use, or household use.',
  'I agree not to ingest, inject, inhale, apply, implant, or otherwise administer any Cloud Peptides research material to a human or animal. I will not use or represent these materials for the diagnosis, treatment, mitigation, cure, or prevention of any disease or medical condition.',
  'I confirm that I am legally permitted to access and handle the relevant research materials in my jurisdiction, and I agree to comply with all applicable laws, regulations, institutional requirements, and safety procedures.',
];

export const RESEARCHER_CERTIFICATION_CHECKBOX_LABEL =
  'I have read, understand, and agree to the Researcher Certification, Research Use Policy, Terms of Service, and Privacy Policy.';

export const RESEARCHER_CERTIFICATION_FALSE_INFO_NOTICE =
  'Providing false information or using Cloud Peptides materials contrary to these terms may result in immediate account suspension or termination.';

export const AGE_CONFIRMATION_LABEL = 'I confirm that I am at least 18 years old.';

export interface AttestationVersions {
  certification_version: string;
  research_use_policy_version: string;
  terms_version: string;
  privacy_version: string;
}

export const CURRENT_ATTESTATION_VERSIONS: AttestationVersions = {
  certification_version: CURRENT_CERTIFICATION_VERSION,
  research_use_policy_version: CURRENT_RESEARCH_USE_POLICY_VERSION,
  terms_version: CURRENT_TERMS_VERSION,
  privacy_version: CURRENT_PRIVACY_VERSION,
};

export interface LatestAttestation {
  certification_version: string;
  accepted_at: string;
}

/**
 * Whether a researcher (role='member') must be sent to /certify before
 * seeing any other protected content. Staff roles (contributor+) never
 * need a researcher_profiles/attestation row at all — see
 * src/middleware.ts, which only calls this for role='member' sessions.
 *
 * True when: no attestation exists yet (brand-new account, or an
 * existing pre-gate account that never certified); the latest
 * attestation's certification_version is older than the current one
 * (a global text change); or an admin has set
 * force_recertify_after later than the latest attestation (a
 * per-account "require renewed certification" action).
 */
export function needsCertification(
  latest: LatestAttestation | null,
  forceRecertifyAfter: string | null,
): boolean {
  if (!latest) return true;
  if (latest.certification_version !== CURRENT_CERTIFICATION_VERSION) return true;
  if (forceRecertifyAfter && new Date(latest.accepted_at) < new Date(forceRecertifyAfter)) {
    return true;
  }
  return false;
}
