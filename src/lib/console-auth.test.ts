import { describe, it, expect, vi, beforeEach } from "vitest";
import { getConsoleOperator, isConsoleAuthed } from "./console-auth";
import { getConsoleClient } from "./supabase/ssr";
import { getServiceClient } from "./supabase/server";

vi.mock("./supabase/ssr", () => ({ getConsoleClient: vi.fn() }));
vi.mock("./supabase/server", () => ({ getServiceClient: vi.fn() }));

const mockedConsole = vi.mocked(getConsoleClient);
const mockedService = vi.mocked(getServiceClient);

/** A cookie-client stub whose getUser() resolves to the given user. */
function authClient(user: { id: string; email?: string } | null, error: unknown = null) {
  return { auth: { getUser: async () => ({ data: { user }, error }) } } as never;
}

/** A service-client stub whose operators lookup resolves to the given row. */
function serviceClient(op: unknown, error: unknown = null) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: op, error }) }),
      }),
    }),
  } as never;
}

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

  it("returns null when the user is authenticated but NOT an operator", async () => {
    mockedConsole.mockReturnValue(authClient({ id: "u1", email: "x@y.com" }));
    mockedService.mockReturnValue(serviceClient(null)); // no operators row
    expect(await getConsoleOperator()).toBeNull();
    expect(await isConsoleAuthed()).toBe(false);
  });

  it("returns null when the operator row is deactivated", async () => {
    mockedConsole.mockReturnValue(authClient({ id: "u1" }));
    mockedService.mockReturnValue(
      serviceClient({ user_id: "u1", email: "x@y.com", role: "reviewer", active: false }),
    );
    expect(await getConsoleOperator()).toBeNull();
  });

  it("returns the operator for an authenticated, active operator", async () => {
    mockedConsole.mockReturnValue(authClient({ id: "u1", email: "fallback@y.com" }));
    mockedService.mockReturnValue(
      serviceClient({ user_id: "u1", email: "op@y.com", role: "admin", active: true }),
    );
    expect(await getConsoleOperator()).toEqual({
      userId: "u1",
      email: "op@y.com",
      role: "admin",
    });
    expect(await isConsoleAuthed()).toBe(true);
  });

  it("treats a session-validation error as unauthenticated", async () => {
    mockedConsole.mockReturnValue(authClient(null, { message: "bad jwt" }));
    mockedService.mockReturnValue(serviceClient(null));
    expect(await getConsoleOperator()).toBeNull();
  });
});
