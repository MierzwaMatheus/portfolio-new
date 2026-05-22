import { intro, outro, text, select, multiselect, confirm, isCancel, cancel } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import { identityPrompt } from "../prompts/identityPrompt.js";
import { downloadRelease } from "../utils/download.js";

// ---- Tipos -----------------------------------------------------------------

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
  copyFile?: (src: string, dest: string) => Promise<void>;
  unlink?: (path: string) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  rm: (path: string, opts?: { recursive?: boolean; force?: boolean }) => Promise<void>;
}

export interface RunCreateDeps {
  projectsDir: string;
  fs?: FsModule;
}

// ---- Validação do nome do projeto ------------------------------------------

export function validateProjectName(name: string): void {
  if (/\s/.test(name)) {
    throw new Error(
      `Nome inválido: "${name}" contém espaços. Use hífens ou underscores (ex: meu-portfolio).`
    );
  }
  if (/[^a-zA-Z0-9\-_]/.test(name)) {
    throw new Error(
      `Nome inválido: "${name}" contém caracteres especiais. Use apenas letras, números, hífens e underscores.`
    );
  }
}

// ---- Utilitário: remoção recursiva de diretório ----------------------------

async function removeDir(dirPath: string, fs: FsModule): Promise<void> {
  if (await fs.exists(dirPath)) {
    await fs.rm(dirPath, { recursive: true, force: true });
  }
}

// ---- Comando runCreate -----------------------------------------------------

export async function runCreate(
  projectName: string,
  deps: RunCreateDeps
): Promise<void> {
  validateProjectName(projectName);

  const fs = deps.fs ?? (nodeFsPromises as unknown as FsModule);
  const projectDir = `${deps.projectsDir}/${projectName}`;

  // Ciclo 2: download e limpeza
  await downloadRelease(projectDir, fs as Parameters<typeof downloadRelease>[1]);
  await removeDir(`${projectDir}/templates`, fs);
  await removeDir(`${projectDir}/cli`, fs);
}
