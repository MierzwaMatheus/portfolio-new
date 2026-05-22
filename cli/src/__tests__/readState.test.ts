import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { readState } from "../state/readState.js";

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

const validState = {
  version: "1.0.0",
  layout: "sidebar" as const,
  theme: "cyberpunk",
  accentColor: null,
  fontSans: "Chakra Petch",
  fontMono: "JetBrains Mono",
  radius: "0.5rem",
  plugins: { blog: true, portfolio: true },
};

describe("readState", () => {
  it("cria rubrica.json com defaults quando arquivo não existe", async () => {
    const vol = Volume.fromJSON({});
    const fs = makeFsModule(vol);

    const result = await readState("/project", fs);

    expect(result.version).toBe("0.0.0");
    expect(result.layout).toBe("sidebar");
    expect(result.theme).toBe("cyberpunk");
    expect(result.accentColor).toBeNull();
    expect(result.plugins).toEqual({});

    const written = vol.readFileSync("/project/rubrica.json", "utf-8") as string;
    expect(JSON.parse(written).version).toBe("0.0.0");
  });

  it("lê rubrica.json existente e retorna objeto tipado", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(validState),
    });
    const fs = makeFsModule(vol);

    const result = await readState("/project", fs);

    expect(result.version).toBe("1.0.0");
    expect(result.layout).toBe("sidebar");
    expect(result.theme).toBe("cyberpunk");
    expect(result.accentColor).toBeNull();
    expect(result.fontSans).toBe("Chakra Petch");
    expect(result.fontMono).toBe("JetBrains Mono");
    expect(result.radius).toBe("0.5rem");
    expect(result.plugins).toEqual({ blog: true, portfolio: true });
  });
});
