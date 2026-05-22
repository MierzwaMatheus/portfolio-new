import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { writeState } from "../state/writeState.js";
import type { RubricaState } from "../state/readState.js";

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

const baseState: RubricaState = {
  version: "1.0.0",
  layout: "sidebar",
  theme: "cyberpunk",
  accentColor: null,
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  radius: "0.5rem",
  plugins: { blog: true, portfolio: true },
};

describe("writeState", () => {
  it("merge parcial — atualizar só version preserva layout, theme e plugins", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(baseState),
    });
    const fs = makeFsModule(vol);

    await writeState("/project", { version: "2.0.0" }, fs);

    const written = vol.readFileSync("/project/rubrica.json", "utf-8") as string;
    const parsed = JSON.parse(written) as RubricaState;

    expect(parsed.version).toBe("2.0.0");
    expect(parsed.layout).toBe("sidebar");
    expect(parsed.theme).toBe("cyberpunk");
    expect(parsed.plugins).toEqual({ blog: true, portfolio: true });
  });

  it("persiste todas as propriedades em rubrica.json com formatação de 2 espaços", async () => {
    const vol = Volume.fromJSON({ "/project": null });
    const fs = makeFsModule(vol);

    await writeState("/project", baseState, fs);

    const written = vol.readFileSync("/project/rubrica.json", "utf-8") as string;
    const parsed = JSON.parse(written) as RubricaState;

    expect(parsed.version).toBe("1.0.0");
    expect(parsed.layout).toBe("sidebar");
    expect(parsed.theme).toBe("cyberpunk");
    expect(parsed.accentColor).toBeNull();
    expect(parsed.fontSans).toBe("Inter");
    expect(parsed.fontMono).toBe("JetBrains Mono");
    expect(parsed.radius).toBe("0.5rem");
    expect(parsed.plugins).toEqual({ blog: true, portfolio: true });
    expect(written).toBe(JSON.stringify(baseState, null, 2));
  });
});
