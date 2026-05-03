import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark");
});

function wrapper(props: { defaultTheme?: "light" | "dark"; switchable?: boolean }) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider {...props}>{children}</ThemeProvider>
    );
  };
}

describe("ThemeContext", () => {
  it("uses the defaultTheme when no switchable", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "dark", switchable: false }),
    });
    expect(result.current.theme).toBe("dark");
    expect(result.current.toggleTheme).toBeUndefined();
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("hydrates from localStorage when switchable=true", () => {
    localStorage.setItem("theme", "dark");
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: true }),
    });
    expect(result.current.theme).toBe("dark");
  });

  it("toggleTheme toggles between light and dark when switchable", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: true }),
    });
    expect(result.current.theme).toBe("light");
    act(() => result.current.toggleTheme!());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    act(() => result.current.toggleTheme!());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists toggled theme in localStorage when switchable", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: true }),
    });
    act(() => result.current.toggleTheme!());
    expect(localStorage.getItem("theme")).toBe("dark");
  });

  it("toggleTheme is undefined when switchable=false (no-op)", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: false }),
    });
    expect(result.current.toggleTheme).toBeUndefined();
  });

  it("throws when useTheme is called outside provider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(
      /must be used within ThemeProvider/,
    );
  });
});
