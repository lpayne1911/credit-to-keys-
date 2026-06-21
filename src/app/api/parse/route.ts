/**
 * POST /api/parse — the UPLOAD path's first step.
 *
 * The upload path is NOT instant. Here we (1) store the uploaded quote and
 * (2) extract whatever fields we can, then hand them back for the buyer to
 * CONFIRM and complete before scoring. We never pretend to have read fields we
 * didn't, and we never auto-score from an upload without buyer confirmation.
 *
 * ---------------------------------------------------------------------------
 *  PLACEHOLDER PARSER
 * ---------------------------------------------------------------------------
 *  Real OCR / document understanding (image + PDF → structured fields) is out
 *  of scope for v1 and would depend on an external service. `extractFields`
 *  below is a clearly-labeled placeholder: it returns an empty extraction with
 *  an honest note. Drop a real extractor into `extractFields` ONLY — its return
 *  shape is the contract the form already understands, so nothing else changes.
 * ---------------------------------------------------------------------------
 */
import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

interface ExtractedFields {
  year?: string;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: string;
  vin?: string;
  vehiclePrice?: string;
  apr?: string;
  termMonths?: string;
  monthlyPayment?: string;
  warrantyPrice?: string;
  fees?: { label: string; amount: number }[];
}

/**
 * PLACEHOLDER — replace with a real OCR / LLM document parser.
 * Must return whatever it could confidently extract (partial is fine). Anything
 * omitted is left for the buyer to fill in the confirm step. Returning {} is the
 * honest default until a real parser is wired in.
 */
async function extractFields(_file: File): Promise<ExtractedFields> {
  // PLACEHOLDER — no extraction performed in v1.
  return {};
}

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

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

  // Store the original upload in private storage (service role, server-only).
  let uploadedFilePath: string | null = null;
  const supabase = getServiceClient();
  if (supabase) {
    try {
      const ext = file.name.split(".").pop() || "bin";
      const path = `quotes/${crypto.randomUUID()}.${ext}`;
      const bytes = new Uint8Array(await file.arrayBuffer());
      const { error } = await supabase.storage
        .from("deal-uploads")
        .upload(path, bytes, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });
      if (!error) uploadedFilePath = path;
    } catch {
      // Non-fatal — the buyer can still confirm/enter fields manually.
    }
  }

  const extracted = await extractFields(file);
  const gotAnything = Object.keys(extracted).length > 0;

  return NextResponse.json({
    uploadedFilePath,
    extracted,
    note: gotAnything
      ? "We read what we could from your quote. Please check each field and fill anything we missed before getting your verdict."
      : "We saved your quote, but automatic reading isn't available yet — please enter the numbers from it below. We'll score them the same way.",
  });
}
