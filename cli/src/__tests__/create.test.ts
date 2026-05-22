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

// ---- mocks globais ----------------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

vi.mock("../utils/download.js", () => ({
  downloadRelease: vi.fn(),
}));

vi.mock("../prompts/identityPrompt.js", () => ({
  identityPrompt: vi.fn(async () => ({
    siteName: "Test Site",
    siteUrl: "https://test.com",
    siteDescription: "A test site",
    authorName: "Test Author",
    authorEmail: "test@test.com",
    twitterHandle: "testhandle",
    lang: "pt-BR",
  })),
}));

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

// ---- Ciclo 2: download e remoção de templates/ e cli/ ----------------------

describe("create — download e limpeza do projeto extraído", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("chama downloadRelease com o diretório do projeto", async () => {
    const { downloadRelease } = await import("../utils/download.js");
    const mockDownload = vi.mocked(downloadRelease);
    mockDownload.mockResolvedValueOnce(undefined);

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const fs = makeFsModule(vol);

    const { runCreate } = await import("../commands/create.js");
    await runCreate("meu-portfolio", { projectsDir: "/projects", fs });

    expect(mockDownload).toHaveBeenCalledWith(
      "/projects/meu-portfolio",
      expect.anything()
    );
  });

  it("remove a pasta templates/ do projeto extraído após download", async () => {
    const { downloadRelease } = await import("../utils/download.js");
    const mockDownload = vi.mocked(downloadRelease);

    mockDownload.mockImplementationOnce(async (targetDir, fsArg) => {
      await (fsArg as ReturnType<typeof makeFsModule>).mkdir(`${targetDir}/templates`, { recursive: true });
      await (fsArg as ReturnType<typeof makeFsModule>).writeFile(`${targetDir}/templates/dummy.txt`, "dummy");
      await (fsArg as ReturnType<typeof makeFsModule>).mkdir(`${targetDir}/src/components`, { recursive: true });
      await (fsArg as ReturnType<typeof makeFsModule>).writeFile(`${targetDir}/src/index.css`, ":root{}\n.dark{}");
      await (fsArg as ReturnType<typeof makeFsModule>).writeFile(`${targetDir}/index.html`, "<!DOCTYPE html><html></html>");
      await (fsArg as ReturnType<typeof makeFsModule>).writeFile(`${targetDir}/package.json`, JSON.stringify({ name: "rubrica-template" }));
    });

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const fs = makeFsModule(vol);

    const { runCreate } = await import("../commands/create.js");
    await runCreate("meu-portfolio", { projectsDir: "/projects", fs });

    const templatesExists = await fs.exists("/projects/meu-portfolio/templates");
    expect(templatesExists).toBe(false);
  });

  it("remove a pasta cli/ do projeto extraído após download", async () => {
    const { downloadRelease } = await import("../utils/download.js");
    const mockDownload = vi.mocked(downloadRelease);

    mockDownload.mockImplementationOnce(async (targetDir, fsArg) => {
      await (fsArg as ReturnType<typeof makeFsModule>).mkdir(`${targetDir}/cli`, { recursive: true });
      await (fsArg as ReturnType<typeof makeFsModule>).writeFile(`${targetDir}/cli/dummy.ts`, "// dummy");
      await (fsArg as ReturnType<typeof makeFsModule>).mkdir(`${targetDir}/src/components`, { recursive: true });
      await (fsArg as ReturnType<typeof makeFsModule>).writeFile(`${targetDir}/src/index.css`, ":root{}\n.dark{}");
      await (fsArg as ReturnType<typeof makeFsModule>).writeFile(`${targetDir}/index.html`, "<!DOCTYPE html><html></html>");
      await (fsArg as ReturnType<typeof makeFsModule>).writeFile(`${targetDir}/package.json`, JSON.stringify({ name: "rubrica-template" }));
    });

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const fs = makeFsModule(vol);

    const { runCreate } = await import("../commands/create.js");
    await runCreate("meu-portfolio", { projectsDir: "/projects", fs });

    const cliExists = await fs.exists("/projects/meu-portfolio/cli");
    expect(cliExists).toBe(false);
  });
});
