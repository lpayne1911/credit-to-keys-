import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ReviewEditor calls useRouter at render; stub the navigation context.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: () => {}, push: () => {} }),
}));

import { ReviewEditor } from "@/components/ReviewEditor";
import { FLAG_TYPES, VERDICT_LABEL, type Flag } from "@/lib/fairness-engine";

/**
 * Render tripwire for the operator side — the half that had no coverage and so
 * shipped a stale type dropdown for three commits. Server-rendering the editor
 * and asserting the markup catches exactly that class of break.
 */
function render(initialFlags: Flag[]): string {
  return renderToStaticMarkup(
    createElement(ReviewEditor, {
      dealId: "deal-123",
      initialVerdict: "red",
      initialHeadline: "Push back before signing",
      initialFlags,
    }),
  );
}

describe("ReviewEditor renders", () => {
  it("offers EVERY engine flag type in the dropdown (no drift)", () => {
    // Includes the types whose options went missing last time.
    const html = render([
      { type: "payment_packing", severity: "high", title: "Payment too high", explanation: "x" },
      { type: "trade_lowball", severity: "medium", title: "Trade lowballed", explanation: "x" },
    ]);
    for (const t of FLAG_TYPES) {
      expect(html, `missing <option> for "${t}"`).toContain(`value="${t}"`);
    }
  });

  it("shows the verdict choices, the headline, and the publish action", () => {
    const html = render([]);
    // Apostrophe-free labels (markup escapes "Don't"), enough to prove the row.
    expect(html).toContain(VERDICT_LABEL.green);
    expect(html).toContain(VERDICT_LABEL.amber);
    expect(html).toContain(VERDICT_LABEL.black);
    expect(html).toContain("Push back before signing");
    expect(html).toContain("Publish reviewed verdict");
  });

  it("renders one editable row per incoming flag", () => {
    const html = render([
      { type: "junk_fee", severity: "high", title: "A", explanation: "a" },
      { type: "apr_markup", severity: "medium", title: "B", explanation: "b" },
    ]);
    const rows = html.match(/placeholder="Flag title"/g) ?? [];
    expect(rows).toHaveLength(2);
  });
});
