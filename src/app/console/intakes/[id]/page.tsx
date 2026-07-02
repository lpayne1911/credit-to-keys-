/**
 * Review console — service-request (product_intake) detail. Operator opens a
 * Build My Plan / Concierge / Deal Rescue / Human Review request and sees the
 * full intake payload plus a short-lived signed URL for any uploaded paperwork.
 * Private; gated by operator auth exactly like the deal detail page.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { isConsoleAuthed, isConsoleConfigured } from "@/lib/console-auth";
import { getProductIntakeById, intakeContact, intakeUploadPath } from "@/lib/intakes";
import { getServiceClient } from "@/lib/supabase/server";
import { ConsoleLogin } from "@/components/ConsoleLogin";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Service request — Review console" };

const PRODUCT_LABEL: Record<string, string> = {
  "build-my-plan": "Build My Plan",
  concierge: "Concierge",
  "deal-rescue": "Deal Rescue (post-sale)",
  "human-review": "Human Review",
};

const STATUS_LABEL: Record<string, string> = {
  review_requested: "Review requested",
  in_review: "In review",
  closed: "Closed",
};

/** Payload keys we render specially (not in the generic field list). */
const SPECIAL_KEYS = new Set(["uploadedFilePath", "uploadedFileName"]);

export default async function ConsoleIntakePage({
  params,
}: {
  params: { id: string };
}) {
  if (!(await isConsoleAuthed())) {
    return (
      <main className="min-h-screen bg-navy/5 px-4 py-16">
        <ConsoleLogin configured={isConsoleConfigured()} />
      </main>
    );
  }

  const intake = await getProductIntakeById(params.id);
  if (!intake) notFound();

  // Mark as in_review when an operator first opens a new request (mirrors deals).
  if (intake.status === "review_requested") {
    const supabase = getServiceClient();
    if (supabase) {
      await supabase
        .from("product_intakes")
        .update({ status: "in_review" })
        .eq("id", intake.id);
    }
  }

  // Sign a short-lived URL for any uploaded paperwork (private bucket).
  let fileUrl: string | null = null;
  const uploadPath = intakeUploadPath(intake.payload);
  if (uploadPath) {
    const supabase = getServiceClient();
    if (supabase) {
      const { data } = await supabase.storage
        .from("deal-uploads")
        .createSignedUrl(uploadPath, 60 * 10);
      fileUrl = data?.signedUrl ?? null;
    }
  }

  const fields = Object.entries(intake.payload).filter(
    ([k, v]) => !SPECIAL_KEYS.has(k) && v !== null && v !== undefined && v !== "",
  );
  const uploadedName =
    typeof intake.payload["uploadedFileName"] === "string"
      ? (intake.payload["uploadedFileName"] as string)
      : null;

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-navy/10 bg-navy text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/console" className="text-sm text-cream/80 hover:underline">
            ← Back to console
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <h1 className="font-serif text-2xl font-semibold text-navy">
          {PRODUCT_LABEL[intake.product_id] ?? intake.product_id}
        </h1>
        <p className="text-sm text-navy/55">
          Submitted {new Date(intake.created_at).toLocaleString()} · status:{" "}
          {STATUS_LABEL[intake.status] ?? intake.status}
        </p>

        <section className="card mt-5">
          <h2 className="font-serif text-lg font-semibold text-navy">Contact</h2>
          <p className="mt-2 text-sm text-navy/80">
            {intakeContact(intake.payload) ?? "No contact email provided."}
          </p>
        </section>

        <section className="card mt-5">
          <h2 className="font-serif text-lg font-semibold text-navy">
            What the buyer submitted
          </h2>
          {fields.length === 0 ? (
            <p className="mt-2 text-sm text-navy/55">No fields provided.</p>
          ) : (
            <dl className="mt-3 space-y-3 text-sm">
              {fields.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                    {k.replace(/_/g, " ")}
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-navy/85">
                    {typeof v === "string" ? v : JSON.stringify(v)}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {uploadPath && (
          <section className="card mt-5">
            <h2 className="font-serif text-lg font-semibold text-navy">
              Uploaded paperwork
            </h2>
            <p className="mt-1 text-sm text-navy/60">
              {uploadedName ?? "1 file"} — stored privately; the link below expires
              in 10 minutes.
            </p>
            {fileUrl ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-3 w-full text-sm"
              >
                View uploaded document ↗
              </a>
            ) : (
              <p className="mt-3 text-xs text-navy/50">
                A file was uploaded but a link couldn&apos;t be generated.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
