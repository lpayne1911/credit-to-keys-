import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConsoleOperator, isConsoleAuthed } from "./console-auth";
import { getConsoleClient } from "./supabase/ssr";
import { getServiceClient } from "./supabase/server";

vi.mock("./supabase/ssr", () => ({ getConsoleClient: vi.fn() }));
vi.mock("./supabase/server", () => ({ getServiceClient: vi.fn() }));

const mockedConsole = vi.mocked(getConsoleClient);
const mockedService = vi.mocked(getServiceClient);

type FakeUser = { id: string; email?: string; email_confirmed_at?: string | null };

/** A cookie-client stub whose getUser() resolves to the given user. */
function authClient(user: FakeUser | null, error: unknown = null) {
  return { auth: { getUser: async () => ({ data: { user }, error }) } } as never;
}

/**
 * A service-client stub. operators.select(...).eq("email").maybeSingle() returns
 * `op`; operators.update(...).eq("id") is a no-op awaitable (the link write).
 */
function serviceClient(op: unknown, error: unknown = null) {
  const updateEq = vi.fn(async () => ({ data: null, error: null }));
  return {
    _updateEq: updateEq,
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: op, error }) }) }),
      update: () => ({ eq: updateEq }),
    }),
  } as never;
}

const VERIFIED = "2026-01-01T00:00:00Z";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getConsoleOperator", () => {
  it("returns null when Supabase isn't configured", async () => {
    mockedConsole.mockReturnValue(null);
    mockedService.mockReturnValue(null);
    expect(await getConsoleOperator()).toBeNull();
    expect(await isConsoleAuthed()).toBe(false);
  });

  it("returns null when there is no authenticated user", async () => {
    mockedConsole.mockReturnValue(authClient(null));
    mockedService.mockReturnValue(serviceClient(null));
    expect(await getConsoleOperator()).toBeNull();
  });

  it("returns null when the email is unverified (no email_confirmed_at)", async () => {
    mockedConsole.mockReturnValue(authClient({ id: "u1", email: "op@y.com", email_confirmed_at: null }));
    mockedService.mockReturnValue(
      serviceClient({ id: "o1", email: "op@y.com", user_id: null, role: "admin", active: true }),
    );
    // Must not match an operator on an unverified address.
    expect(await getConsoleOperator()).toBeNull();
  });

  it("returns null when the verified user is NOT on the allowlist", async () => {
    mockedConsole.mockReturnValue(authClient({ id: "u1", email: "x@y.com", email_confirmed_at: VERIFIED }));
    mockedService.mockReturnValue(serviceClient(null));
    expect(await getConsoleOperator()).toBeNull();
    expect(await isConsoleAuthed()).toBe(false);
  });

  it("returns null when the operator row is deactivated", async () => {
    mockedConsole.mockReturnValue(authClient({ id: "u1", email: "op@y.com", email_confirmed_at: VERIFIED }));
    mockedService.mockReturnValue(
      serviceClient({ id: "o1", email: "op@y.com", user_id: "u1", role: "reviewer", active: false }),
    );
    expect(await getConsoleOperator()).toBeNull();
  });

  it("returns the operator for a verified, active, allowlisted user", async () => {
    mockedConsole.mockReturnValue(authClient({ id: "u1", email: "op@y.com", email_confirmed_at: VERIFIED }));
    mockedService.mockReturnValue(
      serviceClient({ id: "o1", email: "op@y.com", user_id: "u1", role: "admin", active: true }),
    );
    expect(await getConsoleOperator()).toEqual({
      id: "o1",
      email: "op@y.com",
      role: "admin",
      userId: "u1",
    });
    expect(await isConsoleAuthed()).toBe(true);
  });

  it("links user_id on first login when the row isn't linked yet", async () => {
    mockedConsole.mockReturnValue(authClient({ id: "u9", email: "new@y.com", email_confirmed_at: VERIFIED }));
    const svc = serviceClient({ id: "o9", email: "new@y.com", user_id: null, role: "reviewer", active: true });
    mockedService.mockReturnValue(svc);
    const op = await getConsoleOperator();
    expect(op?.userId).toBe("u9");
    // The link-update write was issued.
    expect((svc as unknown as { _updateEq: ReturnType<typeof vi.fn> })._updateEq).toHaveBeenCalledOnce();
  });

  it("treats a session-validation error as unauthenticated", async () => {
    mockedConsole.mockReturnValue(authClient(null, { message: "bad jwt" }));
    mockedService.mockReturnValue(serviceClient(null));
    expect(await getConsoleOperator()).toBeNull();
  });
});
