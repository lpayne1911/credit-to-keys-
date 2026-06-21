/**
 * POST /api/parse — the UPLOAD path's first step.
 *
 * The upload path is NOT instant. Here we (1) store the uploaded quote and
 * (2) extract whatever fields we can, then hand them back for the buyer to
 * CONFIRM and complete before scoring. We never pretend to have read fields we
 * didn't, and we never auto-score from an upload without buyer confirmation.
 *
 * ---------------------------------------------------------------------------
 *  The extractor itself lives behind a swappable seam in
 *  `src/lib/parse/extract.ts`. v1 ships the `none` provider (returns {}), which
 *  is honest: we store the file and ask the buyer to confirm/enter fields. A
 *  real OCR / document-LLM provider drops in there with zero route changes.
 * ---------------------------------------------------------------------------
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import { extractFields } from "@/lib/parse/extract";

// The extractor calls a Claude model — needs the Node runtime (not edge) and a
// longer budget than the default serverless timeout.
export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_PREFIXES = ["image/", "application/pdf"];

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected a file upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "That file is too large (max 15 MB)." },
      { status: 413 },
    );
  }
  const contentType = file.type || "application/octet-stream";
  if (!ALLOWED_PREFIXES.some((p) => contentType.startsWith(p))) {
    return NextResponse.json(
      { error: "Please upload an image or a PDF of your quote." },
      { status: 415 },
    );
  }

  // Read the file once; reuse the bytes for both storage and extraction.
  const bytes = new Uint8Array(await file.arrayBuffer());

  // Store the original upload in private storage (service role, server-only).
  let uploadedFilePath: string | null = null;
  const supabase = getServiceClient();
  if (supabase) {
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `quotes/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("deal-uploads")
        .upload(path, bytes, { contentType, upsert: false });
      if (!error) uploadedFilePath = path;
    } catch {
      // Non-fatal — the buyer can still confirm/enter fields manually.
    }
  }

  const extracted = await extractFields({
    bytes,
    contentType,
    filename: file.name,
  });
  const gotAnything = Object.keys(extracted).length > 0;

  return NextResponse.json({
    uploadedFilePath,
    extracted,
    note: gotAnything
      ? "We read what we could from your quote. Please check each field and fill anything we missed before getting your verdict."
      : "We saved your quote, but automatic reading isn't available yet — please enter the numbers from it below. We'll score them the same way.",
  });
}
