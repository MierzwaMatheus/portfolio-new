import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

Element.prototype.scrollIntoView = Element.prototype.scrollIntoView ?? function () {};

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error - polyfill for older node environments
  globalThis.crypto = require("node:crypto").webcrypto;
}
