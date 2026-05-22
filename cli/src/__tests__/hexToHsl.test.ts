import { describe, it, expect } from "vitest";
import { hexToHsl } from "../utils/hexToHsl.js";

describe("hexToHsl", () => {
  it('converte "#ff0000" para vermelho HSL', () => {
    expect(hexToHsl("#ff0000")).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converte "#000000" para preto HSL', () => {
    expect(hexToHsl("#000000")).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converte "#ffffff" para branco HSL', () => {
    expect(hexToHsl("#ffffff")).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('converte "#0065fe" para valores HSL corretos', () => {
    expect(hexToHsl("#0065fe")).toEqual({ h: 216, s: 100, l: 50 });
  });

  it('lança erro descritivo para "invalid"', () => {
    expect(() => hexToHsl("invalid")).toThrow(/hexToHsl/);
  });

  it('lança erro descritivo para "#gggggg"', () => {
    expect(() => hexToHsl("#gggggg")).toThrow(/hexToHsl/);
  });
});
