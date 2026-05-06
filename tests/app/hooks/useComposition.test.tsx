import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useComposition } from "@/hooks/useComposition";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useComposition", () => {
  it("isComposing transitions true on compositionstart, false on compositionend (after 2 setTimeouts)", () => {
    const { result } = renderHook(() => useComposition());
    expect(result.current.isComposing()).toBe(false);

    act(() => {
      result.current.onCompositionStart({} as any);
    });
    expect(result.current.isComposing()).toBe(true);

    act(() => {
      result.current.onCompositionEnd({} as any);
    });
    // After compositionEnd: still composing — needs two timer ticks (Safari fix)
    expect(result.current.isComposing()).toBe(true);

    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.isComposing()).toBe(false);
  });

  it("blocks Enter (no shift) propagation while composing", () => {
    const userOnKeyDown = vi.fn();
    const { result } = renderHook(() => useComposition({ onKeyDown: userOnKeyDown }));
    act(() => result.current.onCompositionStart({} as any));
    const stopPropagation = vi.fn();
    act(() => {
      result.current.onKeyDown({
        key: "Enter",
        shiftKey: false,
        stopPropagation,
      } as any);
    });
    expect(stopPropagation).toHaveBeenCalled();
    expect(userOnKeyDown).not.toHaveBeenCalled();
  });

  it("blocks Escape propagation while composing", () => {
    const userOnKeyDown = vi.fn();
    const { result } = renderHook(() => useComposition({ onKeyDown: userOnKeyDown }));
    act(() => result.current.onCompositionStart({} as any));
    const stopPropagation = vi.fn();
    act(() => {
      result.current.onKeyDown({
        key: "Escape",
        stopPropagation,
      } as any);
    });
    expect(stopPropagation).toHaveBeenCalled();
    expect(userOnKeyDown).not.toHaveBeenCalled();
  });

  it("does NOT block shift+Enter while composing", () => {
    const userOnKeyDown = vi.fn();
    const { result } = renderHook(() => useComposition({ onKeyDown: userOnKeyDown }));
    act(() => result.current.onCompositionStart({} as any));
    const stopPropagation = vi.fn();
    act(() => {
      result.current.onKeyDown({
        key: "Enter",
        shiftKey: true,
        stopPropagation,
      } as any);
    });
    expect(stopPropagation).not.toHaveBeenCalled();
    expect(userOnKeyDown).toHaveBeenCalled();
  });

  it("forwards keydown when not composing", () => {
    const userOnKeyDown = vi.fn();
    const { result } = renderHook(() => useComposition({ onKeyDown: userOnKeyDown }));
    act(() => {
      result.current.onKeyDown({ key: "Enter", stopPropagation: vi.fn() } as any);
    });
    expect(userOnKeyDown).toHaveBeenCalled();
  });

  it("invokes original onCompositionStart and onCompositionEnd handlers", () => {
    const start = vi.fn();
    const end = vi.fn();
    const { result } = renderHook(() =>
      useComposition({ onCompositionStart: start, onCompositionEnd: end }),
    );
    act(() => result.current.onCompositionStart({} as any));
    act(() => result.current.onCompositionEnd({} as any));
    expect(start).toHaveBeenCalled();
    expect(end).toHaveBeenCalled();
  });

  it("clears pending timers when a new composition starts", () => {
    const { result } = renderHook(() => useComposition());
    act(() => result.current.onCompositionStart({} as any));
    act(() => result.current.onCompositionEnd({} as any));
    // start a new composition before timers fire
    act(() => result.current.onCompositionStart({} as any));
    act(() => vi.runAllTimers());
    // still composing because the new compositionStart re-set the flag
    expect(result.current.isComposing()).toBe(true);
  });
});
