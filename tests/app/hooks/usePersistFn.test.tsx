import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePersistFn } from "@/hooks/usePersistFn";

describe("usePersistFn", () => {
  it("returns the same function reference across re-renders", () => {
    const fn = vi.fn(() => 1);
    const { result, rerender } = renderHook(({ f }) => usePersistFn(f), {
      initialProps: { f: fn },
    });
    const first = result.current;
    rerender({ f: vi.fn(() => 2) });
    const second = result.current;
    expect(first).toBe(second);
  });

  it("invokes the latest version of the wrapped function", () => {
    let called = "";
    const a = () => (called = "a");
    const b = () => (called = "b");
    const { result, rerender } = renderHook(({ f }) => usePersistFn(f), {
      initialProps: { f: a },
    });
    act(() => {
      result.current();
    });
    expect(called).toBe("a");
    rerender({ f: b });
    act(() => {
      result.current();
    });
    expect(called).toBe("b");
  });

  it("forwards arguments to the wrapped function", () => {
    const fn = vi.fn((a: number, b: number) => a + b);
    const { result } = renderHook(() => usePersistFn(fn));
    let r: number;
    act(() => {
      r = result.current(2, 3);
    });
    expect(r!).toBe(5);
  });
});
