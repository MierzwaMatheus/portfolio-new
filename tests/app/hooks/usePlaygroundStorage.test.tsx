import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  usePlaygroundStorage,
  usePlaygroundApiKey,
} from "@/hooks/usePlaygroundStorage";

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("usePlaygroundStorage", () => {
  it("returns default value when nothing in storage", () => {
    const { result } = renderHook(() => usePlaygroundStorage("k", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("hydrates from localStorage on mount", () => {
    localStorage.setItem("pg_k", JSON.stringify("stored"));
    const { result } = renderHook(() => usePlaygroundStorage("k", "fallback"));
    expect(result.current[0]).toBe("stored");
  });

  it("falls back to default when stored JSON is corrupt", () => {
    localStorage.setItem("pg_k", "{not json");
    const { result } = renderHook(() => usePlaygroundStorage("k", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("set persists value with PREFIX 'pg_'", () => {
    const { result } = renderHook(() => usePlaygroundStorage("k", 0));
    act(() => result.current[1](42));
    expect(result.current[0]).toBe(42);
    expect(JSON.parse(localStorage.getItem("pg_k")!)).toBe(42);
  });

  it("set accepts an updater function", () => {
    const { result } = renderHook(() => usePlaygroundStorage("c", 1));
    act(() => result.current[1]((p) => p + 5));
    expect(result.current[0]).toBe(6);
  });

  it("clear removes localStorage and resets to default", () => {
    const { result } = renderHook(() => usePlaygroundStorage("k", "default"));
    act(() => result.current[1]("changed"));
    expect(localStorage.getItem("pg_k")).not.toBeNull();
    act(() => result.current[2]());
    expect(localStorage.getItem("pg_k")).toBeNull();
    expect(result.current[0]).toBe("default");
  });

  it("ignores quota errors in setItem", () => {
    const { result } = renderHook(() => usePlaygroundStorage("k", 0));
    const setItemSpy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementationOnce(() => {
        throw new Error("QuotaExceededError");
      });
    act(() => result.current[1](1));
    expect(result.current[0]).toBe(1); // state still updated
    setItemSpy.mockRestore();
  });
});

describe("usePlaygroundApiKey", () => {
  it("starts empty when no key in sessionStorage", () => {
    const { result } = renderHook(() => usePlaygroundApiKey());
    expect(result.current[0]).toBe("");
  });

  it("hydrates from sessionStorage", () => {
    sessionStorage.setItem("pg_openrouter_key", "secret");
    const { result } = renderHook(() => usePlaygroundApiKey());
    expect(result.current[0]).toBe("secret");
  });

  it("save() stores key in sessionStorage", () => {
    const { result } = renderHook(() => usePlaygroundApiKey());
    act(() => result.current[1]("k1"));
    expect(sessionStorage.getItem("pg_openrouter_key")).toBe("k1");
    expect(result.current[0]).toBe("k1");
  });

  it("save('') removes the key", () => {
    sessionStorage.setItem("pg_openrouter_key", "old");
    const { result } = renderHook(() => usePlaygroundApiKey());
    act(() => result.current[1](""));
    expect(sessionStorage.getItem("pg_openrouter_key")).toBeNull();
  });

  it("removes the key on beforeunload", () => {
    sessionStorage.setItem("pg_openrouter_key", "old");
    renderHook(() => usePlaygroundApiKey());
    window.dispatchEvent(new Event("beforeunload"));
    expect(sessionStorage.getItem("pg_openrouter_key")).toBeNull();
  });
});
