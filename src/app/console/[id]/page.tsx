/**
 * Review console — deal detail. Operator opens a deal, reviews everything the
 * buyer submitted (and any uploaded file), then writes/adjusts and publishes a
 * reviewed verdict. Private; gated by the v1 stopgap password.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { isConsoleAuthed } from "@/lib/console-auth";
import { getDealById } from "@/lib/deals";
import { getServiceClient } from "@/lib/supabase/server";
import { ConsoleLogin } from "@/components/ConsoleLogin";
import { isConsoleConfigured } from "@/lib/console-auth";
import { VerdictView } from "@/components/VerdictView";
import { ReviewEditor } from "@/components/ReviewEditor";
import { LogoutButton } from "@/components/LogoutButton";
import type { FairnessResult, Flag } from "@/lib/fairness-engine";

export const dynamic = "force-dynamic";
export const metadata = { title: "Deal detail — Review console" };

function money(n: number | null) {
  if (n === null || n === undefined) return "—";
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export default async function ConsoleDealPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isConsoleAuthed()) {
    return (
      <main className="min-h-screen bg-navy/5 px-4 py-16">
        <ConsoleLogin configured={isConsoleConfigured()} />
      </main>
    );
  }

  const deal = await getDealById(params.id);
  if (!deal) notFound();

  // Mark as in_review when an operator first opens a requested review.
  if (deal.status === "review_requested") {
    const supabase = getServiceClient();
    if (supabase) {
      await supabase
        .from("deals")
        .update({ status: "in_review" })
        .eq("id", deal.id);
    }
  }

  // Sign a short-lived URL for any uploaded quote (private bucket).
  let fileUrl: string | null = null;
  if (deal.uploaded_file_path) {
    const supabase = getServiceClient();
    if (supabase) {
      const { data } = await supabase.storage
        .from("deal-uploads")
        .createSignedUrl(deal.uploaded_file_path, 60 * 10);
      fileUrl = data?.signedUrl ?? null;
    }
  }

  const auto = (deal.auto_result as FairnessResult) ?? null;
  const initialFlags: Flag[] =
    (deal.reviewed_flags as Flag[] | null) ?? auto?.flags ?? [];

  return (
    <main className="min-h-screen bg-cream">
      <header className="border-b border-navy/10 bg-navy text-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/console" className="text-sm text-cream/80 hover:underline">
            ← All deals
          </Link>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-2">
        {/* Left: what the buyer submitted + auto verdict */}
        <div className="space-y-5">
          <div>
            <h1 className="font-serif text-2xl font-semibold text-navy">
              {[deal.vehicle_year, deal.vehicle_make, deal.vehicle_model]
                .filter(Boolean)
                .join(" ") || "Deal"}
              {deal.vehicle_trim ? ` ${deal.vehicle_trim}` : ""}
            </h1>
            <p className="text-sm text-navy/55">
              Submitted {new Date(deal.created_at).toLocaleString()} ·{" "}
              {deal.input_path} entry · status: {deal.status}
            </p>
          </div>

          <section className="card">
            <h2 className="font-serif text-lg font-semibold text-navy">
              Submitted numbers
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Row k="Mileage" v={deal.vehicle_mileage?.toLocaleString() ?? "—"} />
              <Row k="VIN" v={deal.vehicle_vin ?? "—"} />
              <Row k="Vehicle price" v={money(deal.vehicle_price)} />
              <Row k="Down payment" v={money(deal.down_payment)} />
              <Row k="APR" v={deal.apr != null ? `${deal.apr}%` : "—"} />
              <Row k="Term" v={deal.term_months ? `${deal.term_months} mo` : "—"} />
              <Row k="Monthly" v={money(deal.monthly_payment)} />
              <Row k="Credit band" v={deal.credit_band ?? "—"} />
            </dl>

            {deal.fees && deal.fees.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                  Fees / add-ons
                </p>
                <ul className="mt-1 text-sm text-navy/75">
                  {deal.fees.map((f, i) => (
                    <li key={i} className="flex justify-between border-b border-navy/5 py-1">
                      <span>{f.label || "—"}</span>
                      <span>{money(f.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(deal.warranty_price != null || deal.warranty_coverage_tier) && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">
                  Extended warranty
                </p>
                <dl className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <Row k="Provider" v={deal.warranty_provider ?? "—"} />
                  <Row k="Coverage" v={deal.warranty_coverage_tier ?? "—"} />
                  <Row
                    k="Term"
                    v={deal.warranty_term_months ? `${deal.warranty_term_months} mo` : "—"}
                  />
                  <Row
                    k="Miles"
                    v={deal.warranty_term_miles?.toLocaleString() ?? "—"}
                  />
                  <Row k="Price quoted" v={money(deal.warranty_price)} />
                </dl>
              </div>
            )}

            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary mt-4 w-full text-sm"
              >
                View uploaded quote ↗
              </a>
            )}
            {deal.uploaded_file_path && !fileUrl && (
              <p className="mt-3 text-xs text-navy/50">
                A file was uploaded but a link couldn&apos;t be generated.
              </p>
            )}
          </section>

          {auto && (
            <section>
              <h2 className="mb-2 font-serif text-lg font-semibold text-navy">
                Automatic verdict
              </h2>
              <VerdictView
                result={auto}
                loan={{
                  vehiclePrice: deal.vehicle_price,
                  downPayment: deal.down_payment,
                  apr: deal.apr,
                  termMonths: deal.term_months,
                  fees: deal.fees,
                  warrantyPrice: deal.warranty_price,
                }}
              />
            </section>
          )}
        </div>

        {/* Right: the editor */}
        <div>
          <div className="sticky top-6">
            <section className="card">
              <h2 className="font-serif text-lg font-semibold text-navy">
                Write the reviewed verdict
              </h2>
              <p className="mt-1 text-sm text-navy/60">
                Adjust the verdict and red flags, then publish. The customer sees
                your reviewed verdict in place of the automatic one. Publishing is
                the delivery of this (free in v1) review.
              </p>
              <div className="mt-4">
                <ReviewEditor
                  dealId={deal.id}
                  initialVerdict={
                    deal.reviewed_verdict ?? deal.auto_verdict ?? "amber"
                  }
                  initialHeadline={
                    deal.reviewed_headline ?? auto?.headline ?? ""
                  }
                  initialFlags={initialFlags}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-navy/50">{k}</dt>
      <dd className="text-right font-medium text-navy/85">{v}</dd>
    </>
  );
}
