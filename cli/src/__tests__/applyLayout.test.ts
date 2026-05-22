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
  vol.mkdirSync("/templates/layouts/sidebar", { recursive: true });
  vol.writeFileSync("/templates/layouts/sidebar/Layout.tsx", "// sidebar Layout");
  vol.writeFileSync("/templates/layouts/sidebar/Sidebar.tsx", "// Sidebar");

  vol.mkdirSync("/templates/layouts/topbar", { recursive: true });
  vol.writeFileSync("/templates/layouts/topbar/Layout.tsx", "// topbar Layout");
  vol.writeFileSync("/templates/layouts/topbar/Navbar.tsx", "// Navbar");

  vol.mkdirSync("/templates/layouts/centered", { recursive: true });
  vol.writeFileSync("/templates/layouts/centered/Layout.tsx", "// centered Layout");
  vol.writeFileSync("/templates/layouts/centered/Footer.tsx", "// Footer");

  vol.mkdirSync("/project/src/components", { recursive: true });
}

describe("applyLayout", () => {
  it("layout sidebar copia Layout.tsx e Sidebar.tsx para src/components/", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await applyLayout("sidebar", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const sidebar = vol.readFileSync("/project/src/components/Sidebar.tsx", "utf-8") as string;
    expect(layout).toContain("sidebar Layout");
    expect(sidebar).toContain("Sidebar");
  });

  it("layout topbar copia Layout.tsx e Navbar.tsx, não copia Sidebar.tsx", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await applyLayout("topbar", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const navbar = vol.readFileSync("/project/src/components/Navbar.tsx", "utf-8") as string;
    expect(layout).toContain("topbar Layout");
    expect(navbar).toContain("Navbar");
    expect(await fs.exists("/project/src/components/Sidebar.tsx")).toBe(false);
  });

  it("layout centered copia Layout.tsx e Footer.tsx, não copia Sidebar.tsx nem Navbar.tsx", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await applyLayout("centered", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs);

    const layout = vol.readFileSync("/project/src/components/Layout.tsx", "utf-8") as string;
    const footer = vol.readFileSync("/project/src/components/Footer.tsx", "utf-8") as string;
    expect(layout).toContain("centered Layout");
    expect(footer).toContain("Footer");
    expect(await fs.exists("/project/src/components/Sidebar.tsx")).toBe(false);
    expect(await fs.exists("/project/src/components/Navbar.tsx")).toBe(false);
  });

  it("layout inexistente lança erro descritivo com o nome inválido", async () => {
    const vol = Volume.fromJSON({});
    makeTemplates(vol);
    const fs = makeFsModule(vol);

    await expect(
      applyLayout("naoexiste" as "sidebar", { projectDir: PROJECT_DIR, templatesDir: TEMPLATES_DIR }, fs)
    ).rejects.toThrow(/naoexiste/);
  });
});
