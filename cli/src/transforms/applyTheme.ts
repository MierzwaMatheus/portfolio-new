import * as nodeFsPromises from "node:fs/promises";
import { hexToHsl } from "../utils/hexToHsl.js";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

interface ThemeVars {
  root: string;
  dark: string;
}

const PRESETS: Record<string, ThemeVars> = {
  cyberpunk: {
    root: `  --background: 0 0% 14.5%;
  --foreground: 0 0% 90%;
  --card: 0 0% 4%;
  --card-foreground: 0 0% 90%;
  --popover: 0 0% 4%;
  --popover-foreground: 0 0% 90%;
  --primary: 263 90% 66%;
  --primary-foreground: 0 0% 100%;
  --secondary: 215 28% 17%;
  --secondary-foreground: 0 0% 90%;
  --muted: 0 0% 9%;
  --muted-foreground: 0 0% 64%;
  --accent: 0 0% 9%;
  --accent-foreground: 0 0% 90%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 15%;
  --input: 0 0% 15%;
  --ring: 263 90% 66%;
  --radius: 0.5rem;
  --sidebar: 0 0% 0%;
  --sidebar-foreground: 0 0% 64%;
  --sidebar-primary: 263 90% 66%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 0 0% 9%;
  --sidebar-accent-foreground: 0 0% 90%;
  --sidebar-border: 0 0% 15%;
  --sidebar-ring: 263 90% 66%;
  --neon-purple: 271 91% 65%;
  --neon-lime: 82 85% 67%;`,
    dark: `  --background: 0 0% 8%;
  --foreground: 0 0% 90%;
  --card: 0 0% 4%;
  --card-foreground: 0 0% 90%;
  --popover: 0 0% 4%;
  --popover-foreground: 0 0% 90%;
  --primary: 263 90% 66%;
  --primary-foreground: 0 0% 100%;
  --secondary: 215 28% 17%;
  --secondary-foreground: 0 0% 90%;
  --muted: 0 0% 9%;
  --muted-foreground: 0 0% 64%;
  --accent: 0 0% 9%;
  --accent-foreground: 0 0% 90%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 15%;
  --input: 0 0% 15%;
  --ring: 263 90% 66%;
  --sidebar: 0 0% 4%;
  --sidebar-foreground: 0 0% 64%;
  --sidebar-primary: 263 90% 66%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 0 0% 9%;
  --sidebar-accent-foreground: 0 0% 90%;
  --sidebar-border: 0 0% 15%;
  --sidebar-ring: 263 90% 66%;`,
  },
};

function buildCustomThemeVars(accentColor: string): ThemeVars {
  const { h, s, l } = hexToHsl(accentColor);
  const hsl = `${h} ${s}% ${l}%`;
  const vars = `  --primary: ${hsl};
  --ring: ${hsl};
  --sidebar-primary: ${hsl};
  --sidebar-ring: ${hsl};`;
  return { root: vars, dark: vars };
}

function replaceBlock(css: string, selector: string, newVars: string): string {
  const re = new RegExp(`(${selector.replace(".", "\\.")} \\{)[^}]*(\\})`, "s");
  return css.replace(re, `$1\n${newVars}\n$2`);
}

export async function applyTheme(
  options: { preset?: string; accentColor?: string },
  cssPath: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  let vars: ThemeVars;

  if (options.preset) {
    const theme = PRESETS[options.preset];
    if (!theme) {
      throw new Error(`applyTheme: preset "${options.preset}" não encontrado.`);
    }
    vars = theme;
  } else if (options.accentColor) {
    vars = buildCustomThemeVars(options.accentColor);
  } else {
    throw new Error("applyTheme: forneça preset ou accentColor.");
  }

  const css = await fsModule.readFile(cssPath, "utf-8");
  let updated = replaceBlock(css, ":root", vars.root);
  updated = replaceBlock(updated, ".dark", vars.dark);
  await fsModule.writeFile(cssPath, updated);
}
