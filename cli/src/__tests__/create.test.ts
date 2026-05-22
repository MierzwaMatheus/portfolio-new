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
      try {
        await (vol.promises as unknown as { rmdir: (p: string, o: { recursive: boolean }) => Promise<void> }).rmdir(path, { recursive: true });
      } catch {
        // ignora se não existir
      }
    },
  };
}

/** Helper: configura download mock mínimo com diretórios extras opcionais */
async function setupDownloadMock(extraDirs: string[] = []) {
  const { downloadRelease } = await import("../utils/download.js");
  vi.mocked(downloadRelease).mockImplementationOnce(async (targetDir, fsArg) => {
    const f = fsArg as ReturnType<typeof makeFsModule>;
    await f.mkdir(`${targetDir}/src`, { recursive: true });
    await f.mkdir(`${targetDir}/templates`, { recursive: true });
    await f.writeFile(`${targetDir}/src/index.css`, ":root{}\n.dark{}");
    await f.writeFile(`${targetDir}/index.html`, "<!DOCTYPE html><html></html>");
    await f.writeFile(`${targetDir}/package.json`, JSON.stringify({ name: "rubrica-template" }));
    for (const dir of extraDirs) {
      await f.mkdir(`${targetDir}/${dir}`, { recursive: true });
      await f.writeFile(`${targetDir}/${dir}/.keep`, "");
    }
  });
  return downloadRelease;
}

/** Helper: cria vol + fs e chama runCreate com mocks padrão de layout+tema */
async function runCreateWith(opts: {
  layout?: string;
  theme?: string;
  accentColor?: string;
  extraDirs?: string[];
}) {
  const { select, text } = await import("@clack/prompts");
  vi.mocked(select)
    .mockResolvedValueOnce(opts.layout ?? "sidebar")
    .mockResolvedValueOnce(opts.theme ?? "cyberpunk");

  if (opts.accentColor) {
    vi.mocked(text).mockResolvedValueOnce(opts.accentColor);
  }

  await setupDownloadMock(opts.extraDirs ?? []);

  const vol = Volume.fromJSON({});
  vol.mkdirSync("/projects", { recursive: true });
  const fs = makeFsModule(vol);

  const { runCreate } = await import("../commands/create.js");
  await runCreate("meu-portfolio", { projectsDir: "/projects", fs });

  return { vol, fs };
}

// ---- mocks globais ----------------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn().mockResolvedValue(""),
  select: vi.fn().mockResolvedValue("sidebar"),
  multiselect: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

vi.mock("../utils/download.js", () => ({
  downloadRelease: vi.fn(),
}));

vi.mock("../transforms/applyTheme.js", () => ({
  applyTheme: vi.fn(),
}));

vi.mock("../transforms/applyLayout.js", () => ({
  applyLayout: vi.fn(),
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
    await setupDownloadMock();
    const { select } = await import("@clack/prompts");
    vi.mocked(select)
      .mockResolvedValueOnce("sidebar")
      .mockResolvedValueOnce("cyberpunk");

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const fs = makeFsModule(vol);
    const { runCreate } = await import("../commands/create.js");
    await runCreate("meu-portfolio", { projectsDir: "/projects", fs });

    const { downloadRelease } = await import("../utils/download.js");
    expect(vi.mocked(downloadRelease)).toHaveBeenCalledWith("/projects/meu-portfolio", expect.anything());
  });

  it("remove a pasta templates/ do projeto extraído após o uso dos templates", async () => {
    await setupDownloadMock(["templates/layouts/sidebar"]);
    const { select } = await import("@clack/prompts");
    vi.mocked(select)
      .mockResolvedValueOnce("sidebar")
      .mockResolvedValueOnce("cyberpunk");

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const fs = makeFsModule(vol);
    const { runCreate } = await import("../commands/create.js");
    await runCreate("meu-portfolio", { projectsDir: "/projects", fs });

    expect(await fs.exists("/projects/meu-portfolio/templates")).toBe(false);
  });

  it("remove a pasta cli/ do projeto extraído após download", async () => {
    await setupDownloadMock(["cli", "templates"]);
    const { select } = await import("@clack/prompts");
    vi.mocked(select)
      .mockResolvedValueOnce("sidebar")
      .mockResolvedValueOnce("cyberpunk");

    const vol = Volume.fromJSON({});
    vol.mkdirSync("/projects", { recursive: true });
    const fs = makeFsModule(vol);
    const { runCreate } = await import("../commands/create.js");
    await runCreate("meu-portfolio", { projectsDir: "/projects", fs });

    expect(await fs.exists("/projects/meu-portfolio/cli")).toBe(false);
  });
});

// ---- Ciclo 3: applyLayout --------------------------------------------------

describe("create — applyLayout", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("chama applyLayout com layout sidebar quando selecionado nos prompts", async () => {
    await runCreateWith({ layout: "sidebar" });

    const { applyLayout } = await import("../transforms/applyLayout.js");
    expect(vi.mocked(applyLayout)).toHaveBeenCalledWith(
      "sidebar",
      expect.objectContaining({ projectDir: "/projects/meu-portfolio" }),
      expect.anything()
    );
  });

  it("chama applyLayout com topbar quando selecionado nos prompts", async () => {
    await runCreateWith({ layout: "topbar" });

    const { applyLayout } = await import("../transforms/applyLayout.js");
    expect(vi.mocked(applyLayout)).toHaveBeenCalledWith(
      "topbar",
      expect.objectContaining({ projectDir: "/projects/meu-portfolio" }),
      expect.anything()
    );
  });
});

// ---- Ciclo 4: applyTheme ---------------------------------------------------

describe("create — applyTheme", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("chama applyTheme com preset cyberpunk quando selecionado", async () => {
    await runCreateWith({ theme: "cyberpunk" });

    const { applyTheme } = await import("../transforms/applyTheme.js");
    expect(vi.mocked(applyTheme)).toHaveBeenCalledWith(
      { preset: "cyberpunk" },
      "/projects/meu-portfolio/src/index.css",
      expect.anything()
    );
  });

  it("chama applyTheme com preset minimal quando selecionado", async () => {
    await runCreateWith({ theme: "minimal" });

    const { applyTheme } = await import("../transforms/applyTheme.js");
    expect(vi.mocked(applyTheme)).toHaveBeenCalledWith(
      { preset: "minimal" },
      "/projects/meu-portfolio/src/index.css",
      expect.anything()
    );
  });

  it("chama applyTheme com accentColor quando tema personalizado selecionado", async () => {
    await runCreateWith({ theme: "custom", accentColor: "#0065fe" });

    const { applyTheme } = await import("../transforms/applyTheme.js");
    expect(vi.mocked(applyTheme)).toHaveBeenCalledWith(
      { accentColor: "#0065fe" },
      "/projects/meu-portfolio/src/index.css",
      expect.anything()
    );
  });
});
