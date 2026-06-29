import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as createPOST } from "./route";
import { POST as updatePOST } from "./[id]/route";
import { getConsoleOperator } from "@/lib/console-auth";
import { addOperator, updateOperator } from "@/lib/operators";

vi.mock("@/lib/console-auth", () => ({ getConsoleOperator: vi.fn() }));
vi.mock("@/lib/operators", () => ({ addOperator: vi.fn(), updateOperator: vi.fn() }));

const mockedMe = vi.mocked(getConsoleOperator);
const mockedAdd = vi.mocked(addOperator);
const mockedUpdate = vi.mocked(updateOperator);

const ADMIN = { id: "me", email: "admin@y.com", role: "admin" as const, userId: "u-me" };
const REVIEWER = { id: "r", email: "rev@y.com", role: "reviewer" as const, userId: "u-r" };

function req(body: unknown): Request {
  return new Request("http://localhost/api/console/operators", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/console/operators (create)", () => {
  it("401 when not authenticated", async () => {
    mockedMe.mockResolvedValue(null);
    expect((await createPOST(req({ email: "a@b.com" }))).status).toBe(401);
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("403 when authenticated but not an admin", async () => {
    mockedMe.mockResolvedValue(REVIEWER);
    expect((await createPOST(req({ email: "a@b.com" }))).status).toBe(403);
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("400 on an invalid email", async () => {
    mockedMe.mockResolvedValue(ADMIN);
    expect((await createPOST(req({ email: "not-an-email" }))).status).toBe(400);
  });

  it("200 and invites when an admin submits a valid email", async () => {
    mockedMe.mockResolvedValue(ADMIN);
    mockedAdd.mockResolvedValue({
      ok: true,
      operator: {
        id: "o2", email: "a@b.com", role: "reviewer", active: true,
        user_id: null, invited_by: "admin@y.com", created_at: "", linked_at: null,
      },
    });
    const res = await createPOST(req({ email: "a@b.com", role: "reviewer" }));
    expect(res.status).toBe(200);
    expect(mockedAdd).toHaveBeenCalledWith("a@b.com", "reviewer", "admin@y.com");
  });
});

describe("POST /api/console/operators/[id] (update)", () => {
  it("403 for a non-admin", async () => {
    mockedMe.mockResolvedValue(REVIEWER);
    const res = await updatePOST(req({ active: false }), { params: { id: "x" } });
    expect(res.status).toBe(403);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("409 when an admin tries to deactivate their own row", async () => {
    mockedMe.mockResolvedValue(ADMIN);
    const res = await updatePOST(req({ active: false }), { params: { id: "me" } });
    expect(res.status).toBe(409);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("409 when an admin tries to demote themselves", async () => {
    mockedMe.mockResolvedValue(ADMIN);
    const res = await updatePOST(req({ role: "reviewer" }), { params: { id: "me" } });
    expect(res.status).toBe(409);
  });

  it("200 when an admin updates another operator", async () => {
    mockedMe.mockResolvedValue(ADMIN);
    mockedUpdate.mockResolvedValue({
      ok: true,
      operator: {
        id: "o3", email: "c@d.com", role: "reviewer", active: false,
        user_id: null, invited_by: null, created_at: "", linked_at: null,
      },
    });
    const res = await updatePOST(req({ active: false }), { params: { id: "o3" } });
    expect(res.status).toBe(200);
    expect(mockedUpdate).toHaveBeenCalledWith("o3", { active: false });
  });
});
