import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const root = resolve(__dirname, "../../..");

const sidebarSrc = readFileSync(
  resolve(root, "templates/layouts/cyberpunk/Sidebar.tsx"),
  "utf8"
);

describe("cyberpunk Sidebar — contrato de cores CSS", () => {
  it("não usa classe Tailwind text-primary", () => {
    expect(sidebarSrc).not.toMatch(/\btext-primary\b/);
  });

  it("não usa classe Tailwind bg-primary (sem /)", () => {
    expect(sidebarSrc).not.toMatch(/\bbg-primary\b(?!\/)/);
  });

  it("não usa classe Tailwind border-primary (sem /)", () => {
    expect(sidebarSrc).not.toMatch(/\bborder-primary\b(?!\/)/);
  });

  it("não usa classe Tailwind text-accent (sem /)", () => {
    expect(sidebarSrc).not.toMatch(/\btext-accent\b(?!\/)/);
  });
});
