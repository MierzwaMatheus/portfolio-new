import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMatrixText } from "@/hooks/useMatrixText";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useMatrixText", () => {
  it("starts with displayText length matching text and reaches final text after enough iterations", () => {
    const { result } = renderHook(() =>
      useMatrixText({ text: "Hello", speed: 50 }),
    );
    // After mount, animate() runs once synchronously; each tick increments iteration by 1/3
    expect(result.current).toHaveLength(5);
    // Run enough timers (text length / (1/3) = 15) to reach final text
    act(() => {
      vi.advanceTimersByTime(50 * 20);
    });
    expect(result.current).toBe("Hello");
  });

  it("returns empty string when text is empty", () => {
    const { result } = renderHook(() => useMatrixText({ text: "" }));
    expect(result.current).toBe("");
  });

  it("uses provided custom chars in random pool", () => {
    const { result } = renderHook(() =>
      useMatrixText({ text: "AB", speed: 100, chars: "X" }),
    );
    // Initial render-with-randoms uses 'X' for non-revealed chars; iteration starts at 0
    // After first animate, both chars random
    expect(result.current).toMatch(/^[AX][BX]$/);
  });

  it("clears interval on unmount", () => {
    const clearSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = renderHook(() =>
      useMatrixText({ text: "Hi", speed: 50 }),
    );
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });
});
