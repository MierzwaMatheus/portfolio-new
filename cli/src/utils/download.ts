import * as nodeFsPromises from "node:fs/promises";
import * as https from "node:https";
import * as tar from "node:stream";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
}

const GITHUB_REPO = "matheusmierzwa/rubrica";

/**
 * Retorna a tag da versão mais recente da release do GitHub.
 * Lança erro amigável em caso de falha de rede ou release inexistente.
 */
export async function getLatestVersion(): Promise<string> {
  const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { "User-Agent": "create-rubrica-cli" },
    });
  } catch {
    throw new Error(
      "Erro de rede ao consultar o GitHub. Verifique sua conexão e tente novamente."
    );
  }
  if (!response.ok) {
    throw new Error(
      `Não foi possível obter a versão mais recente do Rubrica (HTTP ${response.status}). Verifique sua conexão.`
    );
  }
  const data = (await response.json()) as { tag_name?: string };
  if (!data.tag_name) {
    throw new Error(
      "Release sem tarball encontrada no GitHub. Tente novamente mais tarde."
    );
  }
  return data.tag_name;
}

/**
 * Stub: simula o download e extração do tarball criando a estrutura mínima
 * de diretórios esperada no targetDir.
 *
 * A implementação real (com fetch + tar extract) fica na task 3.1.
 */
export async function downloadRelease(
  targetDir: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  // Em produção: baixar tarball e extrair no targetDir.
  // Por ora, cria a estrutura mínima para que os transforms possam rodar.
  await fsModule.mkdir(targetDir, { recursive: true });
  await fsModule.mkdir(`${targetDir}/src/components`, { recursive: true });
  await fsModule.mkdir(`${targetDir}/src`, { recursive: true });
  await fsModule.mkdir(`${targetDir}/templates/layouts/sidebar`, { recursive: true });
  await fsModule.mkdir(`${targetDir}/templates/layouts/topbar`, { recursive: true });
  await fsModule.mkdir(`${targetDir}/templates/layouts/centered`, { recursive: true });
  await fsModule.mkdir(`${targetDir}/templates/themes`, { recursive: true });
  await fsModule.mkdir(`${targetDir}/cli`, { recursive: true });
  await fsModule.writeFile(`${targetDir}/src/index.css`, ":root {}\n.dark {}");
  await fsModule.writeFile(`${targetDir}/index.html`, "<!DOCTYPE html><html></html>");
  await fsModule.writeFile(`${targetDir}/package.json`, JSON.stringify({ name: "rubrica-template", version: "0.1.0" }, null, 2));
  await fsModule.writeFile(`${targetDir}/convex/pluginRegistry.ts`, "// registry");
}
