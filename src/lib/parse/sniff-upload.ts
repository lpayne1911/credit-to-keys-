/**
 * Content-based upload type detection for the quote-upload path.
 *
 * The `/api/parse` route must NOT trust the client-declared MIME (`file.type`)
 * or the user-supplied filename: both are attacker-controlled. A request can
 * claim `image/png` while carrying arbitrary bytes, and a filename like
 * `x.pdf/../../evil` would otherwise flow into the storage key.
 *
 * This module sniffs the leading "magic" bytes and returns a CANONICAL content
 * type plus a SAFE, fixed extension (always `[a-z0-9]+`), or `null` when the
 * bytes are not one of the allowed buyer-quote formats. Pure + unit-testable.
 *
 * Allowed: PDF and the common phone-photo image formats (JPEG, PNG, GIF, WebP,
 * HEIC/HEIF) — the formats a buyer would actually photograph a dealer quote in.
 */

export interface SniffedUpload {
  /** Canonical content type to store the object as. */
  contentType: string;
  /** Safe extension (no dot), derived from the format — never the filename. */
  ext: string;
}

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  if (bytes.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[offset + i] !== sig[i]) return false;
  }
  return true;
}

/** ASCII helper for container-brand checks (e.g. "WEBP", "ftyp", "heic"). */
function asciiAt(bytes: Uint8Array, offset: number, text: string): boolean {
  if (bytes.length < offset + text.length) return false;
  for (let i = 0; i < text.length; i++) {
    if (bytes[offset + i] !== text.charCodeAt(i)) return false;
  }
  return true;
}

/**
 * Inspect the magic bytes of an uploaded file. Returns the canonical type +
 * safe extension, or null if it isn't an allowed image/PDF.
 */
export function sniffUpload(bytes: Uint8Array): SniffedUpload | null {
  // PDF — "%PDF"
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46])) {
    return { contentType: "application/pdf", ext: "pdf" };
  }
  // JPEG — FF D8 FF
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { contentType: "image/jpeg", ext: "jpg" };
  }
  // PNG — 89 50 4E 47 0D 0A 1A 0A
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { contentType: "image/png", ext: "png" };
  }
  // GIF — "GIF87a" / "GIF89a"
  if (asciiAt(bytes, 0, "GIF87a") || asciiAt(bytes, 0, "GIF89a")) {
    return { contentType: "image/gif", ext: "gif" };
  }
  // WebP — "RIFF" .... "WEBP"
  if (asciiAt(bytes, 0, "RIFF") && asciiAt(bytes, 8, "WEBP")) {
    return { contentType: "image/webp", ext: "webp" };
  }
  // HEIC/HEIF (iPhone photos) — ISO-BMFF "ftyp" box with a heic/heif/mif1 brand.
  if (asciiAt(bytes, 4, "ftyp")) {
    if (
      asciiAt(bytes, 8, "heic") ||
      asciiAt(bytes, 8, "heix") ||
      asciiAt(bytes, 8, "heif") ||
      asciiAt(bytes, 8, "mif1") ||
      asciiAt(bytes, 8, "hevc")
    ) {
      return { contentType: "image/heic", ext: "heic" };
    }
  }
  return null;
}
