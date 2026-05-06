import { describe, it, expect, beforeEach, vi } from "vitest";
import { CachedTranslationService } from "@/i18n/implementations/CachedTranslationService";

function createMockService() {
  return {
    translate: vi.fn(async (text: string) => `EN(${text})`),
    translateBatch: vi.fn(async (texts: string[]) =>
      texts.map((t) => `EN(${t})`),
    ),
  };
}

describe("CachedTranslationService · translate", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns text as-is when source === target locale", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    expect(await svc.translate("hello", "pt-BR", "pt-BR")).toBe("hello");
    expect(inner.translate).not.toHaveBeenCalled();
  });

  it("returns empty string when text is empty", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    expect(await svc.translate("", "en-US", "pt-BR")).toBe("");
    expect(inner.translate).not.toHaveBeenCalled();
  });

  it("calls inner service on cache miss and persists", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    expect(await svc.translate("oi", "en-US", "pt-BR")).toBe("EN(oi)");
    expect(inner.translate).toHaveBeenCalledTimes(1);

    const stored = JSON.parse(localStorage.getItem("translation_cache")!);
    expect(stored["pt-BR:en-US:oi"]).toBe("EN(oi)");
  });

  it("returns cached value on hit (no inner call)", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    await svc.translate("oi", "en-US", "pt-BR");
    inner.translate.mockClear();
    expect(await svc.translate("oi", "en-US", "pt-BR")).toBe("EN(oi)");
    expect(inner.translate).not.toHaveBeenCalled();
  });
});

describe("CachedTranslationService · translateBatch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns input unchanged when source === target", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    expect(await svc.translateBatch(["a", "b"], "pt-BR", "pt-BR")).toEqual([
      "a",
      "b",
    ]);
    expect(inner.translateBatch).not.toHaveBeenCalled();
  });

  it("only translates uncached items, preserves order", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    await svc.translate("a", "en-US", "pt-BR"); // pre-cache "a"
    inner.translateBatch.mockClear();

    const result = await svc.translateBatch(["a", "b", "c"], "en-US", "pt-BR");
    expect(result).toEqual(["EN(a)", "EN(b)", "EN(c)"]);
    expect(inner.translateBatch).toHaveBeenCalledTimes(1);
    expect(inner.translateBatch).toHaveBeenCalledWith(
      ["b", "c"],
      "en-US",
      "pt-BR",
    );
  });

  it("returns empty array for empty input", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    expect(await svc.translateBatch([], "en-US", "pt-BR")).toEqual([]);
    expect(inner.translateBatch).not.toHaveBeenCalled();
  });

  it("does not call inner when all items are cached", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    await svc.translateBatch(["a", "b"], "en-US", "pt-BR");
    inner.translateBatch.mockClear();

    const result = await svc.translateBatch(["a", "b"], "en-US", "pt-BR");
    expect(result).toEqual(["EN(a)", "EN(b)"]);
    expect(inner.translateBatch).not.toHaveBeenCalled();
  });
});

describe("CachedTranslationService · clearCache", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("removes the localStorage entry and clears in-memory cache", async () => {
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    await svc.translate("x", "en-US", "pt-BR");
    expect(localStorage.getItem("translation_cache")).not.toBeNull();
    svc.clearCache();
    expect(localStorage.getItem("translation_cache")).toBeNull();

    inner.translate.mockClear();
    await svc.translate("x", "en-US", "pt-BR");
    expect(inner.translate).toHaveBeenCalledTimes(1);
  });
});

describe("CachedTranslationService · loadCacheFromStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("hydrates cache from localStorage on construction", async () => {
    localStorage.setItem(
      "translation_cache",
      JSON.stringify({ "pt-BR:en-US:hi": "Hello" }),
    );
    const inner = createMockService();
    const svc = new CachedTranslationService(inner as any);
    expect(await svc.translate("hi", "en-US", "pt-BR")).toBe("Hello");
    expect(inner.translate).not.toHaveBeenCalled();
  });

  it("ignores corrupted JSON in storage", async () => {
    localStorage.setItem("translation_cache", "{broken json");
    const inner = createMockService();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => new CachedTranslationService(inner as any)).not.toThrow();
    errSpy.mockRestore();
  });
});
