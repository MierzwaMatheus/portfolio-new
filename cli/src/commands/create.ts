import { intro, outro, text, select, multiselect, confirm, isCancel, cancel } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import { identityPrompt } from "../prompts/identityPrompt.js";
import { downloadRelease } from "../utils/download.js";
import { applyLayout } from "../transforms/applyLayout.js";
import { applyTheme } from "../transforms/applyTheme.js";

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

  // Ciclo 2: download
  await downloadRelease(projectDir, fs as Parameters<typeof downloadRelease>[1]);

  // Ciclo 3: prompt e apply de layout (antes de remover templates/)
  const layout = await select({
    message: "Layout",
    options: [
      { value: "sidebar", label: "Sidebar — navegação lateral com perfil completo" },
      { value: "topbar", label: "Topbar — navbar horizontal fixa no topo" },
      { value: "centered", label: "Centered — sem nav persistente, foco no conteúdo" },
    ],
  }) as "sidebar" | "topbar" | "centered";

  await applyLayout(
    layout,
    { projectDir, templatesDir: `${projectDir}/templates` },
    fs as Parameters<typeof applyLayout>[2]
  );

  // Ciclo 4: prompt e apply de tema
  const themeChoice = await select({
    message: "Tema visual",
    options: [
      { value: "cyberpunk", label: "Cyberpunk — neon purple + lime, atmosfera dark" },
      { value: "minimal", label: "Minimal — clean, azul neutro, máxima legibilidade" },
      { value: "editorial", label: "Editorial — creme, âmbar, tipografia serifada" },
      { value: "forest", label: "Forest — verde musgo, off-white, orgânico" },
      { value: "custom", label: "Personalizado..." },
    ],
  }) as string;

  let accentColor: string | undefined;
  if (themeChoice === "custom") {
    const hexInput = await text({
      message: "Cor de destaque (hex, ex: #0065fe)",
      validate: (v) => {
        if (!/^#[0-9a-fA-F]{6}$/.test(v)) return "Informe um hex válido (ex: #0065fe)";
      },
    }) as string;
    accentColor = hexInput;
  }

  const themeOptions = themeChoice === "custom"
    ? { accentColor }
    : { preset: themeChoice };

  await applyTheme(
    themeOptions,
    `${projectDir}/src/index.css`,
    fs as Parameters<typeof applyTheme>[2]
  );

  // Ciclo 2: limpeza após uso dos templates
  await removeDir(`${projectDir}/templates`, fs);
  await removeDir(`${projectDir}/cli`, fs);
}
