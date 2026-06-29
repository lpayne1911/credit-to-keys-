import { describe, it, expect } from "vitest";
import { sniffUpload } from "./sniff-upload";

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}
function ascii(text: string, pad = 0): Uint8Array {
  const head = new Uint8Array(pad);
  const body = new Uint8Array([...text].map((c) => c.charCodeAt(0)));
  const out = new Uint8Array(head.length + body.length);
  out.set(head, 0);
  out.set(body, head.length);
  return out;
}

describe("sniffUpload", () => {
  it("detects PDF by magic bytes", () => {
    expect(sniffUpload(ascii("%PDF-1.7"))).toEqual({ contentType: "application/pdf", ext: "pdf" });
  });

  it("detects JPEG", () => {
    expect(sniffUpload(bytes(0xff, 0xd8, 0xff, 0xe0))).toEqual({ contentType: "image/jpeg", ext: "jpg" });
  });

  it("detects PNG", () => {
    expect(sniffUpload(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toEqual({
      contentType: "image/png",
      ext: "png",
    });
  });

  it("detects GIF", () => {
    expect(sniffUpload(ascii("GIF89a"))).toEqual({ contentType: "image/gif", ext: "gif" });
  });

  it("detects WebP (RIFF....WEBP)", () => {
    const b = new Uint8Array(12);
    b.set(ascii("RIFF"), 0);
    b.set(ascii("WEBP"), 8);
    expect(sniffUpload(b)).toEqual({ contentType: "image/webp", ext: "webp" });
  });

  it("detects HEIC (ftyp + heic brand)", () => {
    const b = new Uint8Array(12);
    b.set(ascii("ftyp"), 4);
    b.set(ascii("heic"), 8);
    expect(sniffUpload(b)).toEqual({ contentType: "image/heic", ext: "heic" });
  });

  it("rejects a spoofed file whose bytes are not an allowed type", () => {
    // e.g. an HTML/script payload that claimed image/png via file.type
    expect(sniffUpload(ascii("<html><script>alert(1)</script>"))).toBeNull();
  });

  it("rejects empty / too-short input", () => {
    expect(sniffUpload(new Uint8Array(0))).toBeNull();
    expect(sniffUpload(bytes(0xff))).toBeNull();
  });
});
