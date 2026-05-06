import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePlaygroundSession } from "@/hooks/usePlaygroundSession";

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePlaygroundSession", () => {
  it("generates and persists a new session id when none exists", () => {
    const uuidSpy = vi
      .spyOn(crypto, "randomUUID")
      .mockReturnValue("aaaa-bbbb-cccc-dddd" as any);
    const { result } = renderHook(() => usePlaygroundSession());
    expect(result.current).toBe("aaaa-bbbb-cccc-dddd");
    expect(sessionStorage.getItem("playground_session_id")).toBe(
      "aaaa-bbbb-cccc-dddd",
    );
    uuidSpy.mockRestore();
  });

  it("reuses the persisted id on subsequent calls", () => {
    sessionStorage.setItem("playground_session_id", "preexisting-id");
    const { result } = renderHook(() => usePlaygroundSession());
    expect(result.current).toBe("preexisting-id");
  });

  it("falls back to non-crypto UUID when randomUUID unavailable", () => {
    const original = crypto.randomUUID;
    // @ts-expect-error - intentional removal
    crypto.randomUUID = undefined;
    const { result } = renderHook(() => usePlaygroundSession());
    expect(typeof result.current).toBe("string");
    expect(result.current.length).toBeGreaterThan(0);
    crypto.randomUUID = original;
  });

  it("returns the same id across re-renders", () => {
    sessionStorage.setItem("playground_session_id", "stable");
    const { result, rerender } = renderHook(() => usePlaygroundSession());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
