import { outro, text, spinner, isCancel, cancel } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import { execSync as defaultExecSync } from "node:child_process";
import { detectProject as defaultDetectProject } from "../utils/detectProject.js";
import { generateJwtKeys as defaultGenerateJwtKeys } from "../utils/generateJwtKeys.js";

// ---- Tipos ------------------------------------------------------------------

export interface FsModule {
  access: (path: string) => Promise<void>;
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export interface RunSetupDeps {
  cwd?: string;
  fs?: FsModule;
  detectProject?: typeof defaultDetectProject;
  generateJwtKeys?: typeof defaultGenerateJwtKeys;
  execSync?: (cmd: string, opts?: object) => Buffer;
}

// ---- Helpers ----------------------------------------------------------------

function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    result[key] = value;
  }
  return result;
}

// ---- Comando runSetup -------------------------------------------------------

export async function runSetup(deps: RunSetupDeps = {}): Promise<void> {
  const cwd = deps.cwd ?? process.cwd();
  const fs = deps.fs ?? {
    access: (p: string) => nodeFsPromises.access(p).then(() => undefined),
    readFile: (p: string, enc: string) =>
      nodeFsPromises.readFile(p, enc as BufferEncoding) as Promise<string>,
    writeFile: (p: string, data: string) =>
      nodeFsPromises.writeFile(p, data).then(() => undefined),
    mkdir: (p: string, opts: { recursive: boolean }) =>
      nodeFsPromises.mkdir(p, opts).then(() => undefined),
  };
  const detectProject = deps.detectProject ?? defaultDetectProject;
  const generateJwtKeys = deps.generateJwtKeys ?? defaultGenerateJwtKeys;
  const execSync = deps.execSync ?? ((cmd: string, opts?: object) =>
    defaultExecSync(cmd, opts as Parameters<typeof defaultExecSync>[1]) as Buffer
  );

  // 1. Detectar projeto Rubrica
  try {
    await detectProject(cwd);
  } catch (err) {
    cancel((err as Error).message);
    return;
  }

  // 2. Ler .env.local
  const envPath = path.join(cwd, ".env.local");
  let envVars: Record<string, string> = {};
  try {
    const envContent = await fs.readFile(envPath, "utf-8");
    envVars = parseEnvFile(envContent);
  } catch {
    cancel(
      "Arquivo .env.local não encontrado. Rode npx convex dev primeiro para criá-lo."
    );
    return;
  }

  // 3. Validar vars obrigatórias
  if (!envVars["VITE_CONVEX_URL"]) {
    cancel(
      "VITE_CONVEX_URL não encontrado no .env.local. Rode npx convex dev primeiro."
    );
    return;
  }
  if (!envVars["VITE_CONVEX_SITE_URL"]) {
    cancel(
      "VITE_CONVEX_SITE_URL não encontrado no .env.local. Rode npx convex dev primeiro."
    );
    return;
  }

  const siteUrlDefault = envVars["VITE_CONVEX_SITE_URL"];

  // 4. Gerar JWT keys
  const s = spinner();
  s.start("Gerando chaves JWT (RS256)...");
  const { JWT_PRIVATE_KEY, JWKS } = await generateJwtKeys();
  s.stop("Chaves JWT geradas.");

  // 5. Setar JWT_PRIVATE_KEY e JWKS no Convex
  execSync(`npx convex env set JWT_PRIVATE_KEY "${JWT_PRIVATE_KEY}"`, {
    stdio: "pipe",
  });
  execSync(`npx convex env set JWKS "${JWKS}"`, { stdio: "pipe" });

  // 6. Prompt e set de SITE_URL
  const siteUrl = await text({
    message: "URL pública do site (SITE_URL no Convex):",
    initialValue: siteUrlDefault,
    validate: (v) => {
      if (!v || (!v.startsWith("http://") && !v.startsWith("https://")))
        return "URL deve começar com http:// ou https://";
    },
  });

  if (isCancel(siteUrl)) {
    cancel("Setup cancelado.");
    return;
  }

  execSync(`npx convex env set SITE_URL "${siteUrl as string}"`, {
    stdio: "pipe",
  });

  outro(
    `Setup concluído!\n\n  SITE_URL, JWT_PRIVATE_KEY e JWKS configurados no Convex.\n\n  Próximo passo: pnpm dev`
  );
}
