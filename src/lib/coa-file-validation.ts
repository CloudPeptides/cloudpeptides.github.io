/**
 * COA file upload validation — the actual security boundary for
 * src/pages/api/admin/coas/*, not just the RLS/role check. Pure, no
 * fetch/Storage dependency — unit-testable directly.
 *
 * Deliberately does NOT trust the browser's declared Content-Type or
 * filename extension for anything security-relevant:
 *  - The real file type is determined by sniffing the first bytes
 *    (magic numbers) — a file renamed "x.pdf" that's actually an SVG/
 *    HTML/executable is rejected regardless of what name or MIME type
 *    the upload request claims.
 *  - The declared MIME type must still match the sniffed type (belt
 *    and suspenders — catches a mismatched declaration even though
 *    the sniffed type is what's actually enforced).
 *  - The Storage object path is never built from the user-supplied
 *    filename at all (see generateStoragePath) — a crypto-random name
 *    plus the sniffed extension, so there is no filename to sanitize
 *    in the first place and no path-traversal surface. The original
 *    filename is kept only as plain display/download metadata
 *    (src/lib/form-validation.ts's sanitizeText/isSingleLineSafe,
 *    reused here), never as a path component.
 */
import { isSingleLineSafe, sanitizeText } from './form-validation';

export const MAX_COA_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — matches the
// Storage bucket's own file_size_limit (supabase/migrations/
// 20260808150000_commerce_coa_gallery.sql) so a rejection happens here,
// with a clear message, before ever reaching Storage.

export type CoaFileKind = 'pdf' | 'png' | 'jpeg' | 'webp';

const KIND_TO_MIME: Record<CoaFileKind, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const KIND_TO_EXTENSION: Record<CoaFileKind, string> = {
  pdf: 'pdf',
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
};

/** Sniffs the real file type from its leading bytes — never from a
 * filename or declared Content-Type. Returns null for anything that
 * doesn't match one of the four allowed signatures, including SVG,
 * HTML, and executables (none of which have any of these signatures). */
export function sniffFileType(bytes: Uint8Array): CoaFileKind | null {
  if (bytes.length < 12) return null;

  // PDF: "%PDF-"
  if (
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  ) {
    return 'pdf';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'png';
  }

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'jpeg';
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'webp';
  }

  return null;
}

export interface CoaFileValidationResult {
  valid: boolean;
  error?: string;
  kind?: CoaFileKind;
}

/** Full validation: size, real (sniffed) type, and that the declared
 * MIME type isn't lying about it. Does not touch the filename at all
 * — see generateStoragePath for why that's never trusted either. */
export function validateCoaFile(
  bytes: Uint8Array,
  declaredMimeType: string,
): CoaFileValidationResult {
  if (bytes.length === 0) {
    return { valid: false, error: 'The uploaded file is empty.' };
  }
  if (bytes.length > MAX_COA_FILE_BYTES) {
    return { valid: false, error: 'The uploaded file is too large (10 MB maximum).' };
  }
  const kind = sniffFileType(bytes);
  if (!kind) {
    return {
      valid: false,
      error: 'Unsupported file type. Only PDF, PNG, JPEG, and WebP are accepted.',
    };
  }
  if (declaredMimeType !== KIND_TO_MIME[kind]) {
    return {
      valid: false,
      error: "The file's declared type does not match its actual contents.",
    };
  }
  return { valid: true, kind };
}

/** A crypto-random Storage object path — never derived from the
 * user-supplied filename, so there is nothing to path-traverse or
 * sanitize. The extension comes from the sniffed file type, not any
 * client-declared name. */
export function generateStoragePath(kind: CoaFileKind): string {
  return `${crypto.randomUUID()}.${KIND_TO_EXTENSION[kind]}`;
}

/** The original filename is kept only as display/download metadata
 * (never as a path component) — sanitized the same way every other
 * user-supplied text field in this app is (src/lib/form-validation.ts),
 * plus a defensive strip of path-separator characters in case it's
 * ever rendered somewhere that could misinterpret them. */
export function sanitizeOriginalFilename(value: unknown): string {
  const cleaned = sanitizeText(value, 200).replace(/[/\\]/g, '_');
  return isSingleLineSafe(cleaned) ? cleaned : 'upload';
}
