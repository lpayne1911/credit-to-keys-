import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBuyer } from "./buyer-auth";
import { getServerSupabase } from "./supabase/ssr";

vi.mock("./supabase/ssr", () => ({ getServerSupabase: vi.fn() }));
const mocked = vi.mocked(getServerSupabase);

function client(user: { id: string; email?: string } | null, error: unknown = null) {
  return { auth: { getUser: async () => ({ data: { user }, error }) } } as never;
}

beforeEach(() => vi.clearAllMocks());

describe("getBuyer", () => {
  it("returns null when Supabase isn't configured", async () => {
    mocked.mockReturnValue(null);
    expect(await getBuyer()).toBeNull();
  });

  it("returns null when there is no session", async () => {
    mocked.mockReturnValue(client(null));
    expect(await getBuyer()).toBeNull();
  });

  it("returns null on a session-validation error", async () => {
    mocked.mockReturnValue(client(null, { message: "bad jwt" }));
    expect(await getBuyer()).toBeNull();
  });

  it("returns the buyer id + email for a valid session", async () => {
    mocked.mockReturnValue(client({ id: "u1", email: "b@y.com" }));
    expect(await getBuyer()).toEqual({ id: "u1", email: "b@y.com" });
  });

  it("tolerates a user with no email", async () => {
    mocked.mockReturnValue(client({ id: "u2" }));
    expect(await getBuyer()).toEqual({ id: "u2", email: null });
  });
});
