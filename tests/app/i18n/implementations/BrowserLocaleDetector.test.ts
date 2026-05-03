import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { BrowserLocaleDetector } from "@/i18n/implementations/BrowserLocaleDetector";

describe("BrowserLocaleDetector · detect (async)", () => {
  let fetchSpy: any;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns pt-BR when geolocation country_code is BR", async () => {
    fetchSpy.mockResolvedValue({
      json: async () => ({ country_code: "BR" }),
    } as any);
    const det = new BrowserLocaleDetector();
    expect(await det.detect()).toBe("pt-BR");
  });

  it("returns en-US for any other country", async () => {
    fetchSpy.mockResolvedValue({
      json: async () => ({ country_code: "US" }),
    } as any);
    const det = new BrowserLocaleDetector();
    expect(await det.detect()).toBe("en-US");
  });

  it("falls back to detectSync when fetch rejects", async () => {
    fetchSpy.mockRejectedValue(new Error("network down"));
    Object.defineProperty(navigator, "language", {
      value: "pt-BR",
      configurable: true,
    });
    const det = new BrowserLocaleDetector();
    expect(await det.detect()).toBe("pt-BR");
  });

  it("falls back to en-US when fetch rejects and navigator.language is not pt", async () => {
    fetchSpy.mockRejectedValue(new Error("x"));
    Object.defineProperty(navigator, "language", {
      value: "en-GB",
      configurable: true,
    });
    const det = new BrowserLocaleDetector();
    expect(await det.detect()).toBe("en-US");
  });
});

describe("BrowserLocaleDetector · detectSync", () => {
  it("returns pt-BR for any pt-* navigator language", () => {
    Object.defineProperty(navigator, "language", {
      value: "pt-PT",
      configurable: true,
    });
    expect(new BrowserLocaleDetector().detectSync()).toBe("pt-BR");
  });

  it("returns en-US otherwise", () => {
    Object.defineProperty(navigator, "language", {
      value: "fr-FR",
      configurable: true,
    });
    expect(new BrowserLocaleDetector().detectSync()).toBe("en-US");
  });
});
