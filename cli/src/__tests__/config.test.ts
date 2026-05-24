import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runConfig } from "../commands/config.js";

// ---- helpers ----------------------------------------------------------------

function makeFsModule(vol: InstanceType<typeof Volume>) {
  return {
    access: (path: string) =>
      vol.promises.access(path).then(() => undefined),
    readFile: (path: string, encoding: string) =>
      vol.promises.readFile(path, encoding as BufferEncoding) as Promise<string>,
    writeFile: (path: string, data: string) =>
      vol.promises.writeFile(path, data).then(() => undefined),
    mkdir: (path: string, options: { recursive: boolean }) =>
      vol.promises.mkdir(path, options).then(() => undefined),
  };
}

// ---- mocks de @clack/prompts ------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn().mockResolvedValue(""),
  select: vi.fn().mockResolvedValue("cyberpunk"),
  multiselect: vi.fn().mockResolvedValue([]),
  confirm: vi.fn().mockResolvedValue(false),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn() },
}));

import { multiselect, select, text, confirm } from "@clack/prompts";

// ---- Ciclo 1: Estrutura básica + erro fora de projeto Rubrica ---------------

describe("runConfig — detecção de projeto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(multiselect).mockResolvedValue([]);
  });

  it("lança erro amigável quando rubrica.json não existe em nenhum ancestral", async () => {
    const vol = Volume.fromJSON({});
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockRejectedValue(
      new Error('detectProject: nenhum rubrica.json encontrado em "/some/dir" nem em nenhum diretório ancestral.')
    );

    await expect(
      runConfig({ cwd: "/some/dir", detectProject: detectProjectMock, fs })
    ).rejects.toThrow(/rubrica\.json/);

    expect(detectProjectMock).toHaveBeenCalledWith("/some/dir", expect.anything());
  });

  it("não lança erro quando rubrica.json existe no diretório atual", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await expect(
      runConfig({
        cwd: "/project",
        detectProject: detectProjectMock,
        readState: readStateMock,
        writeState: writeStateMock,
        fs,
      })
    ).resolves.not.toThrow();

    expect(detectProjectMock).toHaveBeenCalledWith("/project", expect.anything());
  });
});

// ---- Ciclo 2: Leitura do estado atual ---------------------------------------

describe("runConfig — leitura do estado atual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(multiselect).mockResolvedValue([]);
  });

  it("lê rubrica.json via readState após detectar o projeto", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
    });
    const fs = makeFsModule(vol);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      fs,
    });

    expect(readStateMock).toHaveBeenCalledWith("/project", expect.anything());
  });
});

// ---- Ciclo 3: Prompt multi-select de seções ---------------------------------

describe("runConfig — prompt multi-select de seções", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exibe multi-select com as 4 opções de reconfiguração", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce([]);

    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      fs,
    });

    expect(multiselect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: "identity" }),
          expect.objectContaining({ value: "appearance" }),
          expect.objectContaining({ value: "layout" }),
          expect.objectContaining({ value: "plugins" }),
        ]),
      })
    );
  });
});

// ---- Ciclo 4: Re-configuração de Identidade ---------------------------------

describe("runConfig — identidade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama identityPrompt e applyRubricalConfig quando Identidade selecionada", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["identity"]);

    const identityData = { siteName: "Novo Site", siteUrl: "https://novo.com", siteDescription: "desc", authorName: "Autor", authorEmail: "a@b.com", twitterHandle: "", lang: "pt-BR" as const };
    const identityPromptMock = vi.fn().mockResolvedValue(identityData);
    const applyRubricalConfigMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      identityPrompt: identityPromptMock,
      applyRubricalConfig: applyRubricalConfigMock,
      fs,
    });

    expect(identityPromptMock).toHaveBeenCalledTimes(1);
    expect(applyRubricalConfigMock).toHaveBeenCalledWith(
      expect.objectContaining({ siteName: "Novo Site" }),
      "/project",
      expect.anything()
    );
  });
});

// ---- Ciclo 5: Re-configuração de Aparência ----------------------------------

describe("runConfig — aparência", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama applyTheme, applyFont e applyIndexHtml quando Aparência selecionada", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/src/index.css": ":root {}",
      "/project/index.html": "<html></html>",
    });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    vi.mocked(select)
      .mockResolvedValueOnce("minimal")   // tema
      .mockResolvedValueOnce("Inter")     // fontSans
      .mockResolvedValueOnce("JetBrains Mono") // fontMono
      .mockResolvedValueOnce("0.5rem");   // radius

    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyIndexHtml: applyIndexHtmlMock,
      fs,
    });

    expect(applyThemeMock).toHaveBeenCalledTimes(1);
    expect(applyFontMock).toHaveBeenCalledTimes(1);
    expect(applyIndexHtmlMock).toHaveBeenCalledTimes(1);
  });

  it("usa valores atuais do estado como defaults nos prompts de aparência", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "editorial", accentColor: null, fontSans: "Playfair Display", fontMono: "Fira Code", radius: "0.75rem", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/src/index.css": ":root {}",
      "/project/index.html": "<html></html>",
    });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    vi.mocked(select)
      .mockResolvedValueOnce("editorial")
      .mockResolvedValueOnce("Playfair Display")
      .mockResolvedValueOnce("Fira Code")
      .mockResolvedValueOnce("0.75rem");

    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyIndexHtml: applyIndexHtmlMock,
      fs,
    });

    // Verifica que o select de tema foi chamado com o tema atual como initialValue
    expect(select).toHaveBeenCalledWith(
      expect.objectContaining({ initialValue: "editorial" })
    );
  });
});

// ---- Ciclo 6: Re-configuração de Layout (com aviso) -------------------------

describe("runConfig — layout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama applyLayout quando Layout selecionado e usuário confirma", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("cyberpunk");
    vi.mocked(confirm).mockResolvedValueOnce(true);

    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyLayout: applyLayoutMock,
      fs,
    });

    expect(applyLayoutMock).toHaveBeenCalledWith(
      "cyberpunk",
      expect.anything(),
      expect.anything()
    );
  });

  it("não chama applyLayout quando usuário cancela confirmação", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("cyberpunk");
    vi.mocked(confirm).mockResolvedValueOnce(false);

    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyLayout: applyLayoutMock,
      fs,
    });

    expect(applyLayoutMock).not.toHaveBeenCalled();
  });
});

// ---- Ciclo 7: Re-configuração de Plugins ------------------------------------

describe("runConfig — plugins", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama applyPlugins com o novo mapa quando Plugins selecionado", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: { blog: true, portfolio: true, resume: false } };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect)
      .mockResolvedValueOnce(["plugins"])   // seleção de seções
      .mockResolvedValueOnce(["blog"]);     // seleção de plugins (só blog ativo)

    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyPlugins: applyPluginsMock,
      fs,
    });

    expect(applyPluginsMock).toHaveBeenCalledWith(
      expect.objectContaining({ blog: true, portfolio: false, resume: false }),
      expect.any(String),
      expect.anything()
    );
  });

  it("usa plugins ativos atuais como initialValues no multi-select", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: { blog: true, portfolio: false, resume: true } };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect)
      .mockResolvedValueOnce(["plugins"])
      .mockResolvedValueOnce(["blog", "resume"]);

    const applyPluginsMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyPlugins: applyPluginsMock,
      fs,
    });

    // O segundo multiselect deve ter initialValues com os plugins ativos atuais
    expect(multiselect).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        initialValues: expect.arrayContaining(["blog", "resume"]),
      })
    );
  });
});

// ---- Ciclo 8: Persistência em rubrica.json ----------------------------------

describe("runConfig — persistência em rubrica.json", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("chama writeState com o layout atualizado após trocar layout", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk" as const, theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({ "/project/rubrica.json": JSON.stringify(state) });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["layout"]);
    vi.mocked(select).mockResolvedValueOnce("cyberpunk");
    vi.mocked(confirm).mockResolvedValueOnce(true);

    const applyLayoutMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyLayout: applyLayoutMock,
      fs,
    });

    expect(writeStateMock).toHaveBeenCalledWith(
      "/project",
      expect.objectContaining({ layout: "cyberpunk"}),
      expect.anything()
    );
  });

  it("chama writeState com tema e fontes atualizados após trocar aparência", async () => {
    const state = { version: "1.0.0", layout: "cyberpunk", theme: "cyberpunk", accentColor: null, fontSans: "Inter", fontMono: "JetBrains Mono", radius: "0.5rem", plugins: {} };
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(state),
      "/project/src/index.css": ":root {}",
      "/project/index.html": "<html></html>",
    });
    const fs = makeFsModule(vol);

    vi.mocked(multiselect).mockResolvedValueOnce(["appearance"]);
    vi.mocked(select)
      .mockResolvedValueOnce("forest")
      .mockResolvedValueOnce("DM Sans")
      .mockResolvedValueOnce("IBM Plex Mono")
      .mockResolvedValueOnce("0rem");

    const applyThemeMock = vi.fn().mockResolvedValue(undefined);
    const applyFontMock = vi.fn().mockResolvedValue(undefined);
    const applyIndexHtmlMock = vi.fn().mockResolvedValue(undefined);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const readStateMock = vi.fn().mockResolvedValue(state);
    const writeStateMock = vi.fn().mockResolvedValue(undefined);

    await runConfig({
      cwd: "/project",
      detectProject: detectProjectMock,
      readState: readStateMock,
      writeState: writeStateMock,
      applyTheme: applyThemeMock,
      applyFont: applyFontMock,
      applyIndexHtml: applyIndexHtmlMock,
      fs,
    });

    expect(writeStateMock).toHaveBeenCalledWith(
      "/project",
      expect.objectContaining({
        theme: "forest",
        fontSans: "DM Sans",
        fontMono: "IBM Plex Mono",
        radius: "0rem",
      }),
      expect.anything()
    );
  });
});
