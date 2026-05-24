import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyTheme } from "../transforms/applyTheme.js";

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
  };
}

const stubCss = `@import "tailwindcss";

:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --radius: 0.5rem;
}

.dark {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
}

body { margin: 0; }
`;

describe("applyTheme", () => {
  // ---- editorial-cream (☀ claro) -----------------------------------------------

  it("editorial-cream injeta fundo claro creme e âmbar primário no :root", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--background: 38 30% 96%");
    expect(result).toContain("--foreground: 24 10% 10%");
    expect(result).toContain("--primary: 35 90% 50%");
    expect(result).toContain("--accent: 38 25% 90%");
  });

  it("editorial-cream injeta fundo quente escuro no .dark", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--background: 25 20% 8%");
    expect(result).toContain("--foreground: 38 20% 90%");
  });

  // ---- paper-noir (☀ claro) -----------------------------------------------------

  it("paper-noir injeta fundo quase-branco e vermelho primário no :root", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "paper-noir" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--background: 0 0% 98%");
    expect(result).toContain("--foreground: 0 0% 5%");
    expect(result).toContain("--primary: 0 84% 50%");
    expect(result).toContain("--accent: 0 0% 92%");
  });

  it("paper-noir injeta fundo preto profundo no .dark", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "paper-noir" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--background: 0 0% 5%");
    expect(result).toContain("--foreground: 0 0% 95%");
  });

  // ---- midnight-blue (🌑 escuro, dark-first) ------------------------------------

  it("midnight-blue injeta fundo azul escuro e azul primário no :root", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "midnight-blue" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--background: 222 47% 8%");
    expect(result).toContain("--foreground: 210 40% 96%");
    expect(result).toContain("--primary: 220 90% 56%");
    expect(result).toContain("--accent: 217 33% 17%");
  });

  it("midnight-blue injeta fundo ainda mais profundo no .dark", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "midnight-blue" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--background: 220 14% 5%");
  });

  // ---- solar-warm (🌑 escuro, dark-first) ----------------------------------------

  it("solar-warm injeta fundo quente escuro e laranja primário no :root", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "solar-warm" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--background: 20 30% 8%");
    expect(result).toContain("--foreground: 35 30% 92%");
    expect(result).toContain("--primary: 25 95% 53%");
    expect(result).toContain("--accent: 20 25% 18%");
  });

  it("solar-warm injeta fundo ainda mais escuro no .dark", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "solar-warm" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain("--background: 20 35% 5%");
  });

  // ---- comportamentos gerais -----------------------------------------------------

  it("re-executar com mesmos valores não duplica blocos (idempotência)", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);
    const first = vol.readFileSync("/project/src/index.css", "utf-8") as string;

    await applyTheme({ preset: "editorial-cream" }, "/project/src/index.css", fs);
    const second = vol.readFileSync("/project/src/index.css", "utf-8") as string;

    expect(first).toBe(second);
    const rootMatches = second.match(/:root \{/g) ?? [];
    expect(rootMatches.length).toBe(1);
  });

  it("preset inexistente lança erro descritivo", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await expect(
      applyTheme({ preset: "naoexiste" }, "/project/src/index.css", fs)
    ).rejects.toThrow(/naoexiste/);
  });

  it("presets antigos (minimal, forest, editorial, cyberpunk) não existem mais", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    for (const old of ["minimal", "forest", "editorial", "cyberpunk"]) {
      await expect(
        applyTheme({ preset: old }, "/project/src/index.css", fs)
      ).rejects.toThrow();
    }
  });
});
