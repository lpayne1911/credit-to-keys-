import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { DealCheckForm } from "@/components/DealCheckForm";
import { Disclaimer } from "@/components/Disclaimer";

export const metadata = {
  title: "Check my deal — Driveway Advocate",
};

export default function CheckPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-prose px-4 py-8 sm:py-12">
        <h1 className="font-serif text-3xl font-semibold text-navy">
          Check my deal
        </h1>
        <p className="mt-2 text-navy/65">
          Enter what the dealer is offering. The more you fill in, the sharper
          your verdict — but even a few numbers help. Nothing here is shared with
          any dealer.
        </p>
        <div className="mt-5">
          <Disclaimer />
        </div>
        <div className="mt-6">
          <DealCheckForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
