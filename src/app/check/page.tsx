import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { GamifiedDealCheck } from "@/components/GamifiedDealCheck";
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
          Tap through a few quick questions — no forms to fill out. Nothing here
          is ever shared with a dealer.
        </p>
        <div className="mt-5">
          <Disclaimer />
        </div>
        <div className="mt-6">
          <GamifiedDealCheck />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
