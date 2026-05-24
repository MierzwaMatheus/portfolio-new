import { describe, it, expect } from "vitest";
import { Volume } from "memfs";
import { applyLayout } from "../transforms/applyLayout.js";

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
  };
}

const TEMPLATES_DIR = "/templates";
const PROJECT_DIR = "/project";

function makeTemplates(vol: InstanceType<typeof Volume>) {
  vol.mkdirSync("/templates/layouts/cyberpunk", { recursive: true });
  vol.writeFileSync("/templates/layouts/cyberpunk/Layout.tsx", "// cyberpunk Layout");
  vol.writeFileSync("/templates/layouts/cyberpunk/Sidebar.tsx", "// Sidebar");

  vol.mkdirSync("/project/src/components", { recursive: true });
}

describe("applyLayout", () => {
  it("layout cyberpunk copia Layout.tsx e Sidebar.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await applyLayout("cyberpunk", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const sidebar = vol.readFileSync("/project/src/components/Sidebar.tsx", "utf-8") as string;
    expect(layout).toContain("cyberpunk Layout");
    expect(sidebar).toContain("Sidebar");
  });

  it("layout cyberpunk remove Navbar.tsx e Footer.tsx se existirem", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    vol.writeFileSync("/project/src/components/Navbar.tsx", "// old");
    vol.writeFileSync("/project/src/components/Footer.tsx", "// old");
    const fs = makeFsModule(vol);

    await applyLayout("cyberpunk", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    expect(await fs.exists("/project/src/components/Navbar.tsx")).toBe(false);
    expect(await fs.exists("/project/src/components/Footer.tsx")).toBe(false);
  });

  it("layout brutalist copia Layout.tsx e Navbar.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/brutalist", { recursive: true });
    vol.writeFileSync("/templates/layouts/brutalist/Layout.tsx", "// brutalist Layout");
    vol.writeFileSync("/templates/layouts/brutalist/Navbar.tsx", "// brutalist Navbar");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout("brutalist" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const navbar = vol.readFileSync("/project/src/components/Navbar.tsx", "utf-8") as string;
    expect(layout).toContain("brutalist Layout");
    expect(navbar).toContain("brutalist Navbar");
  });

  it("layout brutalist remove Sidebar.tsx e Footer.tsx se existirem", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/brutalist", { recursive: true });
    vol.writeFileSync("/templates/layouts/brutalist/Layout.tsx", "// brutalist Layout");
    vol.writeFileSync("/templates/layouts/brutalist/Navbar.tsx", "// brutalist Navbar");
    vol.mkdirSync("/project/src/components", { recursive: true });
    vol.writeFileSync("/project/src/components/Sidebar.tsx", "// old sidebar");
    vol.writeFileSync("/project/src/components/Footer.tsx", "// old footer");
    const fs = makeFsModule(vol);

    await applyLayout("brutalist" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    expect(await fs.exists("/project/src/components/Sidebar.tsx")).toBe(false);
    expect(await fs.exists("/project/src/components/Footer.tsx")).toBe(false);
  });

  it("layout swiss copia Layout.tsx e Sidebar.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    vol.mkdirSync("/templates/layouts/swiss", { recursive: true });
    vol.writeFileSync("/templates/layouts/swiss/Layout.tsx", "// swiss Layout");
    vol.writeFileSync("/templates/layouts/swiss/Sidebar.tsx", "// swiss Sidebar");
    vol.mkdirSync("/project/src/components", { recursive: true });
    const fs = makeFsModule(vol);

    await applyLayout("swiss" as Parameters<typeof applyLayout>[0], { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const sidebar = vol.readFileSync("/project/src/components/Sidebar.tsx", "utf-8") as string;
    expect(layout).toContain("swiss Layout");
    expect(sidebar).toContain("swiss Sidebar");
  });

  it("layout inexistente lança erro descritivo com o nome inválido", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await expect(
      applyLayout("naoexiste" as "cyberpunk", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs)
    ).rejects.toThrow(/naoexiste/);
  });
});
