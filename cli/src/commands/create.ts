import { intro, outro, text, select, multiselect, confirm, isCancel, cancel } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import { identityPrompt as defaultIdentityPrompt } from "../prompts/identityPrompt.js";
import { downloadRelease as defaultDownloadRelease } from "../utils/download.js";
import { applyLayout as defaultApplyLayout } from "../transforms/applyLayout.js";
import { applyTheme as defaultApplyTheme } from "../transforms/applyTheme.js";
import { applyFont as defaultApplyFont } from "../transforms/applyFont.js";
import { applyPlugins as defaultApplyPlugins } from "../transforms/applyPlugins.js";
import { applyIndexHtml as defaultApplyIndexHtml } from "../transforms/applyIndexHtml.js";
import { applyRubricalConfig as defaultApplyRubricalConfig } from "../transforms/applyRubricalConfig.js";
import { writeState as defaultWriteState } from "../state/writeState.js";

// ---- Tipos -----------------------------------------------------------------

const ALL_PLUGINS = ["blog", "portfolio", "resume"] as const;

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
  download?: typeof defaultDownloadRelease;
  applyLayout?: typeof defaultApplyLayout;
  applyTheme?: typeof defaultApplyTheme;
  applyFont?: typeof defaultApplyFont;
  applyPlugins?: typeof defaultApplyPlugins;
  applyIndexHtml?: typeof defaultApplyIndexHtml;
  applyRubricalConfig?: typeof defaultApplyRubricalConfig;
  writeState?: typeof defaultWriteState;
  identityPrompt?: typeof defaultIdentityPrompt;
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
  const download = deps.download ?? defaultDownloadRelease;
  const applyLayoutFn = deps.applyLayout ?? defaultApplyLayout;
  const applyThemeFn = deps.applyTheme ?? defaultApplyTheme;
  const applyFontFn = deps.applyFont ?? defaultApplyFont;
  const applyPluginsFn = deps.applyPlugins ?? defaultApplyPlugins;
  const applyIndexHtmlFn = deps.applyIndexHtml ?? defaultApplyIndexHtml;
  const applyRubricalConfigFn = deps.applyRubricalConfig ?? defaultApplyRubricalConfig;
  const writeStateFn = deps.writeState ?? defaultWriteState;
  const doIdentityPrompt = deps.identityPrompt ?? defaultIdentityPrompt;

  const projectDir = `${deps.projectsDir}/${projectName}`;

  // Ciclo 2: download
  await download(projectDir, fs as Parameters<typeof defaultDownloadRelease>[1]);

  // Ciclo 3: prompt e apply de layout (antes de remover templates/)
  const layout = await select({
    message: "Layout",
    options: [
      { value: "sidebar", label: "Sidebar — navegação lateral com perfil completo" },
      { value: "topbar", label: "Topbar — navbar horizontal fixa no topo" },
      { value: "centered", label: "Centered — sem nav persistente, foco no conteúdo" },
    ],
  }) as "sidebar" | "topbar" | "centered";

  await applyLayoutFn(
    layout,
    { projectDir, templatesDir: `${projectDir}/templates` },
    fs as Parameters<typeof defaultApplyLayout>[2]
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

  await applyThemeFn(
    themeOptions,
    `${projectDir}/src/index.css`,
    fs as Parameters<typeof defaultApplyTheme>[2]
  );

  // Ciclo 5: prompts de fonte e radius
  const fontSans = await select({
    message: "Fonte principal",
    options: [
      { value: "Inter", label: "Inter — neutra, legível, padrão de produtos digitais" },
      { value: "Chakra Petch", label: "Chakra Petch — geométrica, tech, futurista" },
      { value: "Playfair Display", label: "Playfair Display — elegante, editorial" },
      { value: "Space Grotesk", label: "Space Grotesk — moderna, startup" },
      { value: "DM Sans", label: "DM Sans — limpa, amigável, versátil" },
    ],
  }) as string;

  const fontMono = await select({
    message: "Fonte mono",
    options: [
      { value: "JetBrains Mono", label: "JetBrains Mono — dev-friendly, clara" },
      { value: "Fira Code", label: "Fira Code — clássico, com ligatures" },
      { value: "Space Mono", label: "Space Mono — retro digital" },
      { value: "IBM Plex Mono", label: "IBM Plex Mono — corporativo-tech" },
    ],
  }) as string;

  const radius = await select({
    message: "Border radius",
    options: [
      { value: "0rem", label: "Nenhum — bordas retas, minimalismo severo" },
      { value: "0.375rem", label: "Suave — sutil arredondamento" },
      { value: "0.5rem", label: "Médio — padrão shadcn/ui" },
      { value: "0.75rem", label: "Arredondado — amigável, moderno" },
      { value: "1rem", label: "Pill — muito arredondado, jovial" },
    ],
  }) as string;

  await applyFontFn(
    { fontSans, fontMono, radius },
    { css: `${projectDir}/src/index.css`, html: `${projectDir}/index.html` },
    fs as Parameters<typeof defaultApplyFont>[2]
  );

  // Ciclo 6: plugins multi-select + applyPlugins
  const selectedPlugins = await multiselect({
    message: "Plugins",
    options: [
      { value: "blog", label: "Blog — listagem e leitura de posts" },
      { value: "portfolio", label: "Portfolio — galeria de projetos" },
      { value: "resume", label: "Resume — currículo interativo" },
    ],
    required: false,
  }) as string[];

  const pluginsRecord = Object.fromEntries(
    ALL_PLUGINS.map((id) => [id, selectedPlugins.includes(id)])
  );

  await applyPluginsFn(
    pluginsRecord,
    `${projectDir}/convex/pluginRegistry.ts`,
    fs as Parameters<typeof defaultApplyPlugins>[2]
  );

  // Ciclo 7: identityPrompt + applyIndexHtml + applyRubricalConfig
  const identity = await doIdentityPrompt();

  await applyIndexHtmlFn(
    {
      fontFamily: fontSans,
      themeColor: accentColor ?? "#6d28d9",
      siteName: identity.siteName,
      siteUrl: identity.siteUrl,
      twitterHandle: identity.twitterHandle,
      authorName: identity.authorName,
    },
    `${projectDir}/index.html`,
    fs as Parameters<typeof defaultApplyIndexHtml>[2]
  );

  await applyRubricalConfigFn(
    {
      siteName: identity.siteName,
      siteUrl: identity.siteUrl,
      siteDescription: identity.siteDescription,
      authorName: identity.authorName,
      authorEmail: identity.authorEmail,
      twitterHandle: identity.twitterHandle,
      lang: identity.lang,
      seoHomeTitle: identity.siteName,
      seoHomeDescription: identity.siteDescription,
      rssTitle: identity.siteName,
      rssDescription: identity.siteDescription,
      ogImageUrl: `${identity.siteUrl}/og.png`,
      accentColor: accentColor ?? "#6d28d9",
      fontSans,
      fontMono,
    },
    projectDir,
    fs as Parameters<typeof defaultApplyRubricalConfig>[2]
  );

  // Ciclo 8: writeState → rubrica.json
  await writeStateFn(
    projectDir,
    {
      version: "0.1.0",
      layout,
      theme: themeChoice === "custom" ? "custom" : themeChoice,
      accentColor: accentColor ?? null,
      fontSans,
      fontMono,
      radius,
      plugins: pluginsRecord,
    },
    fs as Parameters<typeof defaultWriteState>[2]
  );

  // Ciclo 2: limpeza após uso dos templates
  await removeDir(`${projectDir}/templates`, fs);
  await removeDir(`${projectDir}/cli`, fs);
}
