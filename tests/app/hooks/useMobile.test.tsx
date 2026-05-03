import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "@/hooks/useMobile";

let listeners: Array<() => void> = [];

function mockMatchMedia(initial: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: initial,
      media: "",
      onchange: null,
      addEventListener: (_: string, fn: () => void) => listeners.push(fn),
      removeEventListener: (_: string, fn: () => void) => {
        listeners = listeners.filter((l) => l !== fn);
      },
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function setInnerWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
}

beforeEach(() => {
  listeners = [];
});

afterEach(() => {
  listeners = [];
});

describe("useIsMobile", () => {
  it("returns true when innerWidth < 768", () => {
    mockMatchMedia(true);
    setInnerWidth(500);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when innerWidth >= 768", () => {
    mockMatchMedia(false);
    setInnerWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("updates when matchMedia 'change' fires (after innerWidth changes)", () => {
    mockMatchMedia(false);
    setInnerWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    act(() => {
      setInnerWidth(500);
      listeners.forEach((l) => l());
    });
    expect(result.current).toBe(true);
  });

  it("removes the listener on unmount", () => {
    mockMatchMedia(true);
    setInnerWidth(500);
    const { unmount } = renderHook(() => useIsMobile());
    expect(listeners.length).toBe(1);
    unmount();
    expect(listeners.length).toBe(0);
  });
});
