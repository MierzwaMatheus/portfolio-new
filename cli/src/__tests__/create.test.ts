import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";

// ---- helpers ----------------------------------------------------------------

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
    copyFile: (src: string, dest: string) =>
      vol.promises.copyFile(src, dest).then(() => undefined),
    unlink: (path: string) =>
      vol.promises.unlink(path).then(() => undefined),
    exists: async (path: string) => {
      try {
        await vol.promises.access(path);
        return true;
      } catch {
        return false;
      }
    },
    rm: async (path: string, _opts?: { recursive?: boolean; force?: boolean }) => {
      // memfs não tem rm, simula removendo o arquivo/dir via rmdir recursivo
      try {
        await (vol.promises as unknown as { rmdir: (p: string, o: { recursive: boolean }) => Promise<void> }).rmdir(path, { recursive: true });
      } catch {
        // ignora se não existir
      }
    },
  };
}

// ---- Ciclo 1: validação do nome do projeto ----------------------------------

describe("create — validação do nome do projeto", () => {
  it("nome com espaços lança erro descritivo", async () => {
    const { validateProjectName } = await import("../commands/create.js");
    expect(() => validateProjectName("meu portfolio")).toThrow(/espaços/);
  });

  it("nome com caracteres especiais lança erro descritivo", async () => {
    const { validateProjectName } = await import("../commands/create.js");
    expect(() => validateProjectName("meu@portfolio!")).toThrow(/caracteres especiais/);
  });

  it("nome válido é aceito sem lançar erro", async () => {
    const { validateProjectName } = await import("../commands/create.js");
    expect(() => validateProjectName("meu-portfolio")).not.toThrow();
    expect(() => validateProjectName("portfolio_v2")).not.toThrow();
    expect(() => validateProjectName("meuPortfolio")).not.toThrow();
  });
});
