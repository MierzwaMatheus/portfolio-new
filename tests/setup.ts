import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error - polyfill for older node environments
  globalThis.crypto = require("node:crypto").webcrypto;
}
