import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { getBuyer } from "@/lib/buyer-auth";
import { getServiceClient } from "@/lib/supabase/server";
import { ensureCaseForDeal } from "@/lib/cases";

vi.mock("@/lib/buyer-auth", () => ({ getBuyer: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ getServiceClient: vi.fn() }));
vi.mock("@/lib/cases", () => ({ ensureCaseForDeal: vi.fn() }));

const mockedBuyer = vi.mocked(getBuyer);
const mockedClient = vi.mocked(getServiceClient);
const mockedEnsure = vi.mocked(ensureCaseForDeal);

const BUYER = { id: "buyer-1", email: "b@x.com" };

/**
 * A tiny Supabase query-builder stub. `loadResult` is what the select chain
 * resolves to (the deal lookup); `updateError` is what the update chain returns.
 * Both `maybeSingle()` and the terminal `is()` are awaitable.
 */
function fakeClient(opts: { loadResult: unknown; updateError?: unknown }) {
  const update = vi.fn(() => {
    const chain = {
      eq: vi.fn(() => chain),
      is: vi.fn(() => Promise.resolve({ error: opts.updateError ?? null })),
    };
    return chain;
  });
  const select = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn(() => Promise.resolve(opts.loadResult)),
    })),
  }));
  return {
    update,
    from: vi.fn(() => ({ select, update })),
  };
}

/** Cast the query-builder stub to the client type the route expects (test-only). */
function asClient(stub: ReturnType<typeof fakeClient>): ReturnType<typeof getServiceClient> {
  return stub as unknown as ReturnType<typeof getServiceClient>;
}

function req(): Request {
  return new Request("http://localhost/api/deals/d1/claim", { method: "POST" });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/deals/[id]/claim", () => {
  it("401 when not signed in", async () => {
    mockedBuyer.mockResolvedValue(null);
    const res = await POST(req(), { params: { id: "d1" } });
    expect(res.status).toBe(401);
    expect(mockedEnsure).not.toHaveBeenCalled();
  });

  it("404 when the deal does not exist", async () => {
    mockedBuyer.mockResolvedValue(BUYER);
    mockedClient.mockReturnValue(asClient(fakeClient({ loadResult: { data: null, error: null } })));
    const res = await POST(req(), { params: { id: "d1" } });
    expect(res.status).toBe(404);
    expect(mockedEnsure).not.toHaveBeenCalled();
  });

  it("409 when the deal is owned by another account", async () => {
    mockedBuyer.mockResolvedValue(BUYER);
    mockedClient.mockReturnValue(
      asClient(fakeClient({ loadResult: { data: { id: "d1", user_id: "someone-else" }, error: null } })),
    );
    const res = await POST(req(), { params: { id: "d1" } });
    expect(res.status).toBe(409);
    expect(mockedEnsure).not.toHaveBeenCalled();
  });

  it("claims an unowned deal and opens a case", async () => {
    mockedBuyer.mockResolvedValue(BUYER);
    mockedEnsure.mockResolvedValue(undefined);
    const client = fakeClient({
      loadResult: {
        data: {
          id: "d1",
          user_id: null,
          status: "new",
          auto_result: { overallVerdict: "amber" },
          vehicle_year: 2021,
          vehicle_make: "Toyota",
          vehicle_model: "Camry",
        },
        error: null,
      },
    });
    mockedClient.mockReturnValue(asClient(client));
    const res = await POST(req(), { params: { id: "d1" } });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(client.update).toHaveBeenCalledWith({ user_id: "buyer-1" });
    expect(mockedEnsure).toHaveBeenCalledTimes(1);
  });

  it("is idempotent: a deal the caller already owns is a no-op success (no re-claim)", async () => {
    mockedBuyer.mockResolvedValue(BUYER);
    mockedEnsure.mockResolvedValue(undefined);
    const client = fakeClient({
      loadResult: {
        data: { id: "d1", user_id: "buyer-1", status: "new", auto_result: null },
        error: null,
      },
    });
    mockedClient.mockReturnValue(asClient(client));
    const res = await POST(req(), { params: { id: "d1" } });
    expect(res.status).toBe(200);
    // already owned → we never issue the update, only (re)ensure the case
    expect(client.update).not.toHaveBeenCalled();
    expect(mockedEnsure).toHaveBeenCalledTimes(1);
  });
});
