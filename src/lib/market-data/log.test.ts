import { describe, expect, it, vi } from "vitest";
import { logMarketData } from "./log";
import { normalizeDealInput } from "@/lib/deal-engine/normalizeDealInput";
import { buildDealReview } from "@/lib/deal-engine/buildDealReview";

function captureClient() {
  const rows: Record<string, unknown>[] = [];
  const client = {
    from: () => ({
      insert: (row: Record<string, unknown>) => {
        rows.push(row);
        return Promise.resolve({ data: null, error: null });
      },
    }),
  };
  return { client, rows };
}

const SAMPLE = {
  vehicle: { year: "2026", make: "Toyota", model: "Camry", condition: "new", color: "Blue", vin: "4T1DAACK6TU750707" },
  pricing: { vehiclePrice: "40509", totalVehiclePrice: "45693.61", balanceDue: "52260", downPayment: "452.61" },
  fees: [{ label: "Applicable Taxes", amount: "2776.61" }],
  addOns: [{ label: "Service/Maintenance Contract", amount: "3324", financed: true }],
  finance: { apr: "6.9", termMonths: "72" },
  trade: { year: "2018", make: "Honda", model: "Civic", offer: "9000" },
  dealerName: "Waldorf Toyota",
  salesperson: "Swann, D'Marius",
  stockNumber: "00N40400",
  buyerState: "MD",
  source: "upload" as const,
};

describe("logMarketData", () => {
  it("captures vehicle, pricing, dealer & trade facts with no buyer PII", async () => {
    const deal = normalizeDealInput(SAMPLE);
    const result = buildDealReview(deal, { marketValue: null });
    const { client, rows } = captureClient();

    await logMarketData(client as never, deal, result, "upload");

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row).toMatchObject({
      vehicle_make: "Toyota",
      vehicle_condition: "new",
      vehicle_vin: "4T1DAACK6TU750707",
      vehicle_price: 40509,
      total_vehicle_price: 45693.61,
      dealer_name: "Waldorf Toyota",
      salesperson: "Swann, D'Marius",
      stock_number: "00N40400",
      dealer_state: "MD",
      trade_make: "Honda",
      input_path: "upload",
    });
    expect(typeof row.deal_score).toBe("number");

    // Hard guarantee: buyer-identity columns are never written.
    const PII = ["name", "first_name", "last_name", "dob", "date_of_birth", "drivers_license", "license", "insurance", "email", "user_id", "lead_id"];
    for (const key of PII) expect(row).not.toHaveProperty(key);
  });

  it("never throws, even if the insert fails", async () => {
    const deal = normalizeDealInput(SAMPLE);
    const result = buildDealReview(deal, { marketValue: null });
    const failing = { from: () => ({ insert: () => Promise.reject(new Error("boom")) }) };
    await expect(logMarketData(failing as never, deal, result, "manual")).resolves.toBeUndefined();
  });
});
