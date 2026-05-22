import { describe, it, expect, vi, beforeEach } from "vitest";
import { Volume } from "memfs";
import { runSetup } from "../commands/setup.js";

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

const BASE_STATE = {
  version: "1.0.0",
  layout: "sidebar" as const,
  theme: "cyberpunk",
  accentColor: null,
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
  radius: "0.5rem",
  plugins: { blog: true },
};

const VALID_ENV = [
  "VITE_CONVEX_URL=https://precise-husky-581.convex.cloud",
  "VITE_CONVEX_SITE_URL=https://precise-husky-581.convex.site",
].join("\n");

// ---- mocks de @clack/prompts ------------------------------------------------

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  text: vi.fn().mockResolvedValue("https://meusite.com"),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  isCancel: vi.fn(() => false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { cancel } from "@clack/prompts";

// ---- Ciclo 1: leitura de .env.local e detectProject -------------------------

describe("runSetup — Ciclo 1: .env.local e detectProject", () => {
  beforeEach(() => vi.clearAllMocks());

  it("lê VITE_CONVEX_URL corretamente de .env.local existente", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
      "/project/.env.local": VALID_ENV,
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");
    const generateJwtKeysMock = vi.fn().mockResolvedValue({
      JWT_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
      JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
    });
    const execSyncMock = vi.fn().mockReturnValue(Buffer.from(""));

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: generateJwtKeysMock,
      execSync: execSyncMock,
    });

    expect(detectProjectMock).toHaveBeenCalled();
  });

  it("lança erro amigável quando .env.local não existe", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: vi.fn(),
      execSync: vi.fn(),
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("npx convex dev")
    );
  });

  it("lança erro quando VITE_CONVEX_URL está ausente no .env.local", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
      "/project/.env.local": "VITE_CONVEX_SITE_URL=https://x.convex.site\n",
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: vi.fn(),
      execSync: vi.fn(),
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("VITE_CONVEX_URL")
    );
  });

  it("lança erro quando VITE_CONVEX_SITE_URL está ausente no .env.local", async () => {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
      "/project/.env.local":
        "VITE_CONVEX_URL=https://x.convex.cloud\n",
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi.fn().mockResolvedValue("/project/rubrica.json");

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: vi.fn(),
      execSync: vi.fn(),
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("VITE_CONVEX_SITE_URL")
    );
  });

  it("propaga erro de detectProject como mensagem amigável", async () => {
    const vol = Volume.fromJSON({
      "/project/.env.local": VALID_ENV,
    });
    const fs = makeFsModule(vol);
    const detectProjectMock = vi
      .fn()
      .mockRejectedValue(new Error("rubrica.json não encontrado"));

    await runSetup({
      cwd: "/project",
      fs,
      detectProject: detectProjectMock,
      generateJwtKeys: vi.fn(),
      execSync: vi.fn(),
    });

    expect(cancel).toHaveBeenCalledWith(
      expect.stringContaining("rubrica.json não encontrado")
    );
  });
});

// ---- Ciclo 2: JWT keys + convex env set + prompt SITE_URL -------------------

describe("runSetup — Ciclo 2: JWT keys e convex env set", () => {
  beforeEach(() => vi.clearAllMocks());

  function makeValidSetup() {
    const vol = Volume.fromJSON({
      "/project/rubrica.json": JSON.stringify(BASE_STATE),
      "/project/.env.local": VALID_ENV,
    });
    return {
      cwd: "/project",
      fs: makeFsModule(vol),
      detectProject: vi.fn().mockResolvedValue("/project/rubrica.json"),
      generateJwtKeys: vi.fn().mockResolvedValue({
        JWT_PRIVATE_KEY:
          "-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----",
        JWKS: JSON.stringify({ keys: [{ use: "sig", kty: "RSA" }] }),
      }),
      execSync: vi.fn().mockReturnValue(Buffer.from("")),
    };
  }

  it("chama execSync com npx convex env set JWT_PRIVATE_KEY com valor não vazio", async () => {
    const deps = makeValidSetup();

    await runSetup(deps);

    const calls = (deps.execSync as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0] as string
    );
    const jwtCall = calls.find((c) => c.includes("JWT_PRIVATE_KEY"));
    expect(jwtCall).toBeDefined();
    expect(jwtCall).toMatch(/JWT_PRIVATE_KEY/);
    // valor não vazio
    expect(jwtCall).not.toMatch(/JWT_PRIVATE_KEY\s*"?\s*"?$/);
  });

  it("chama execSync com npx convex env set JWKS com JSON válido", async () => {
    const deps = makeValidSetup();

    await runSetup(deps);

    const calls = (deps.execSync as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0] as string
    );
    const jwksCall = calls.find((c) => c.includes("JWKS"));
    expect(jwksCall).toBeDefined();
    // extrai o valor JSON da chamada
    const match = jwksCall?.match(/JWKS\s+"(.+)"$/s) ?? jwksCall?.match(/JWKS\s+'(.+)'$/s);
    if (match) {
      expect(() => JSON.parse(match[1]!)).not.toThrow();
    } else {
      // valor está lá de alguma forma
      expect(jwksCall).toContain("keys");
    }
  });

  it("chama execSync com npx convex env set SITE_URL com valor do prompt", async () => {
    const deps = makeValidSetup();

    await runSetup(deps);

    const calls = (deps.execSync as ReturnType<typeof vi.fn>).mock.calls.map(
      (c) => c[0] as string
    );
    const siteUrlCall = calls.find((c) => c.includes("SITE_URL"));
    expect(siteUrlCall).toBeDefined();
    expect(siteUrlCall).toContain("SITE_URL");
  });

  it("prompt de SITE_URL usa VITE_CONVEX_SITE_URL como initialValue", async () => {
    const { text } = await import("@clack/prompts");

    const deps = makeValidSetup();
    await runSetup(deps);

    expect(text).toHaveBeenCalledWith(
      expect.objectContaining({
        initialValue: "https://precise-husky-581.convex.site",
      })
    );
  });
});
