import { describe, it, expect } from "vitest";
import { timingSafeEqual, escapeTgHtml } from "../../../convex/lib/security";

describe("convex/lib/security · timingSafeEqual", () => {
  it("returns true for identical ASCII strings", () => {
    expect(timingSafeEqual("hello", "hello")).toBe(true);
  });

  it("returns false for strings with different lengths", () => {
    expect(timingSafeEqual("a", "ab")).toBe(false);
    expect(timingSafeEqual("abc", "ab")).toBe(false);
  });

  it("returns false for same-length but different content", () => {
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abcd", "Abcd")).toBe(false);
  });

  it("returns true for empty strings", () => {
    expect(timingSafeEqual("", "")).toBe(true);
  });

  it("returns false when comparing empty with non-empty", () => {
    expect(timingSafeEqual("", "x")).toBe(false);
  });

  it("treats UTF-8 multibyte sequences correctly (different byte length)", () => {
    // "olá" has 4 bytes in UTF-8; "ola" has 3 bytes -> length mismatch
    expect(timingSafeEqual("olá", "ola")).toBe(false);
  });

  it("returns true for identical UTF-8 multibyte strings", () => {
    expect(timingSafeEqual("açaí", "açaí")).toBe(true);
  });
});

describe("convex/lib/security · escapeTgHtml", () => {
  it("escapes & to &amp;", () => {
    expect(escapeTgHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes < and >", () => {
    expect(escapeTgHtml("<b>")).toBe("&lt;b&gt;");
  });

  it("escapes double quotes", () => {
    expect(escapeTgHtml('say "hi"')).toBe("say &quot;hi&quot;");
  });

  it("escapes single quotes to &#39;", () => {
    expect(escapeTgHtml("it's")).toBe("it&#39;s");
  });

  it("does not double-escape ampersand (& is replaced first)", () => {
    expect(escapeTgHtml("&lt;")).toBe("&amp;lt;");
  });

  it("escapes a complete mixture in a single pass", () => {
    expect(escapeTgHtml(`<a href="x">'A & B'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;A &amp; B&#39;&lt;/a&gt;",
    );
  });

  it("returns empty string when given empty string", () => {
    expect(escapeTgHtml("")).toBe("");
  });
});
