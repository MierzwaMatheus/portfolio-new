import { describe, it, expect } from "vitest";
import { hexToHsl } from "../utils/hexToHsl.js";

describe("hexToHsl", () => {
  it('converte "#ff0000" para vermelho HSL', () => {
    expect(hexToHsl("#ff0000")).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converte "#000000" para preto HSL', () => {
    expect(hexToHsl("#000000")).toEqual({ h: 0, s: 0, l: 0 });
  });
});
