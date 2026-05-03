import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("src/lib/utils · cn", () => {
  it("merges multiple class strings", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("ignores falsy values (false, undefined, null, empty string)", () => {
    expect(cn("a", false && "b", undefined, null, "", "c")).toBe("a c");
  });

  it("deduplicates conflicting Tailwind classes via tailwind-merge (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("merges arrays of classes (clsx behavior)", () => {
    expect(cn(["a", "b"], ["c"])).toBe("a b c");
  });

  it("merges object syntax {className: condition}", () => {
    expect(cn({ a: true, b: false, c: true })).toBe("a c");
  });

  it("returns empty string when given no inputs", () => {
    expect(cn()).toBe("");
  });
});
