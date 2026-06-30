import { describe, it, expect } from "vitest";
import { safeRedirectPath, isUuid } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps ordinary same-origin paths", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/deal-review/abc-123")).toBe("/deal-review/abc-123");
    expect(safeRedirectPath("/r/xyz?ref=email")).toBe("/r/xyz?ref=email");
    expect(safeRedirectPath("/market-check#results")).toBe("/market-check#results");
  });

  it("falls back when input is missing or not a string", () => {
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(42)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });

  it("rejects open redirects to other origins", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("http://evil.com/path")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("/\\evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("evil.com")).toBe("/dashboard");
  });

  it("rejects whitespace and control-character smuggling", () => {
    expect(safeRedirectPath("/foo bar")).toBe("/dashboard");
    expect(safeRedirectPath("/foo\tbar")).toBe("/dashboard");
    expect(safeRedirectPath("/foo\nhttps://evil.com")).toBe("/dashboard");
  });

  it("honors a custom fallback", () => {
    expect(safeRedirectPath("nope", "/login")).toBe("/login");
  });

  it("rejects overly long paths", () => {
    expect(safeRedirectPath("/" + "a".repeat(600))).toBe("/dashboard");
  });
});

describe("isUuid", () => {
  it("accepts canonical UUIDs", () => {
    expect(isUuid("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(true);
  });
  it("rejects non-UUIDs", () => {
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid("3f2504e0")).toBe(false);
    expect(isUuid(123)).toBe(false);
    expect(isUuid(undefined)).toBe(false);
  });
});
