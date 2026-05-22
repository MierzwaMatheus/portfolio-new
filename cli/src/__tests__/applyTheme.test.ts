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
  it("injeta bloco :root com variáveis do preset cyberpunk em CSS existente", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "cyberpunk" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain(":root {");
    expect(result).toContain("--primary: 263 90% 66%");
    expect(result).toContain("--background: 0 0% 14.5%");
  });

  it("injeta bloco .dark com variáveis do preset cyberpunk", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "cyberpunk" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    expect(result).toContain(".dark {");
    expect(result).toContain("--background: 0 0% 8%");
  });

  it("re-executar com mesmos valores não duplica blocos (idempotência)", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ preset: "cyberpunk" }, "/project/src/index.css", fs);
    const first = vol.readFileSync("/project/src/index.css", "utf-8") as string;

    await applyTheme({ preset: "cyberpunk" }, "/project/src/index.css", fs);
    const second = vol.readFileSync("/project/src/index.css", "utf-8") as string;

    expect(first).toBe(second);
    const rootMatches = second.match(/:root \{/g) ?? [];
    expect(rootMatches.length).toBe(1);
  });

  it("tema custom com accentColor gera --primary com valor HSL correto", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await applyTheme({ accentColor: "#ff0000" }, "/project/src/index.css", fs);

    const result = vol.readFileSync("/project/src/index.css", "utf-8") as string;
    // #ff0000 = hsl(0, 100%, 50%)
    expect(result).toContain("--primary: 0 100% 50%");
  });

  it("preset inexistente lança erro descritivo", async () => {
    const vol = Volume.fromJSON({ "/project/src/index.css": stubCss });
    const fs = makeFsModule(vol);

    await expect(
      applyTheme({ preset: "naoexiste" }, "/project/src/index.css", fs)
    ).rejects.toThrow(/naoexiste/);
  });
});
