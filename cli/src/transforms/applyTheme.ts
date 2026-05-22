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
  forest: {
    root: `  --background: 60 20% 97%;
  --foreground: 120 8% 12%;
  --card: 60 20% 99%;
  --card-foreground: 120 8% 12%;
  --popover: 60 20% 99%;
  --popover-foreground: 120 8% 12%;
  --primary: 150 40% 35%;
  --primary-foreground: 0 0% 100%;
  --secondary: 80 15% 90%;
  --secondary-foreground: 120 8% 12%;
  --muted: 80 15% 90%;
  --muted-foreground: 120 5% 45%;
  --accent: 80 15% 90%;
  --accent-foreground: 120 8% 12%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 80 15% 84%;
  --input: 80 15% 84%;
  --ring: 150 40% 35%;
  --radius: 0.5rem;
  --sidebar: 60 20% 95%;
  --sidebar-foreground: 120 5% 45%;
  --sidebar-primary: 150 40% 35%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 80 15% 90%;
  --sidebar-accent-foreground: 120 8% 12%;
  --sidebar-border: 80 15% 84%;
  --sidebar-ring: 150 40% 35%;
  --neon-purple: 150 40% 35%;
  --neon-lime: 80 50% 40%;`,
    dark: `  --background: 30 15% 8%;
  --foreground: 60 15% 88%;
  --card: 30 12% 12%;
  --card-foreground: 60 15% 88%;
  --popover: 30 12% 12%;
  --popover-foreground: 60 15% 88%;
  --primary: 150 40% 35%;
  --primary-foreground: 0 0% 100%;
  --secondary: 30 10% 18%;
  --secondary-foreground: 60 15% 88%;
  --muted: 30 10% 18%;
  --muted-foreground: 60 8% 55%;
  --accent: 30 10% 18%;
  --accent-foreground: 60 15% 88%;
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 30 10% 18%;
  --input: 30 10% 18%;
  --ring: 150 40% 35%;
  --sidebar: 30 15% 6%;
  --sidebar-foreground: 60 8% 55%;
  --sidebar-primary: 150 40% 35%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 30 10% 18%;
  --sidebar-accent-foreground: 60 15% 88%;
  --sidebar-border: 30 10% 18%;
  --sidebar-ring: 150 40% 35%;`,
  },
  editorial: {
    root: `  --background: 38 30% 96%;
  --foreground: 24 10% 10%;
  --card: 38 30% 99%;
  --card-foreground: 24 10% 10%;
  --popover: 38 30% 99%;
  --popover-foreground: 24 10% 10%;
  --primary: 35 90% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 38 25% 90%;
  --secondary-foreground: 24 10% 10%;
  --muted: 38 25% 90%;
  --muted-foreground: 24 8% 45%;
  --accent: 38 25% 90%;
  --accent-foreground: 24 10% 10%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 35 20% 85%;
  --input: 35 20% 85%;
  --ring: 35 90% 50%;
  --radius: 0.375rem;
  --sidebar: 38 30% 94%;
  --sidebar-foreground: 24 8% 45%;
  --sidebar-primary: 35 90% 50%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 38 25% 90%;
  --sidebar-accent-foreground: 24 10% 10%;
  --sidebar-border: 35 20% 85%;
  --sidebar-ring: 35 90% 50%;
  --neon-purple: 35 90% 50%;
  --neon-lime: 45 93% 47%;`,
    dark: `  --background: 25 20% 8%;
  --foreground: 38 20% 90%;
  --card: 25 18% 12%;
  --card-foreground: 38 20% 90%;
  --popover: 25 18% 12%;
  --popover-foreground: 38 20% 90%;
  --primary: 35 90% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 25 15% 18%;
  --secondary-foreground: 38 20% 90%;
  --muted: 25 15% 18%;
  --muted-foreground: 35 10% 55%;
  --accent: 25 15% 18%;
  --accent-foreground: 38 20% 90%;
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 25 15% 18%;
  --input: 25 15% 18%;
  --ring: 35 90% 50%;
  --sidebar: 25 20% 6%;
  --sidebar-foreground: 35 10% 55%;
  --sidebar-primary: 35 90% 50%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 25 15% 18%;
  --sidebar-accent-foreground: 38 20% 90%;
  --sidebar-border: 25 15% 18%;
  --sidebar-ring: 35 90% 50%;`,
  },
  minimal: {
    root: `  --background: 0 0% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 47% 11%;
  --primary: 220 90% 56%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 220 90% 56%;
  --radius: 0.5rem;
  --sidebar: 210 40% 98%;
  --sidebar-foreground: 215 16% 47%;
  --sidebar-primary: 220 90% 56%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 210 40% 96%;
  --sidebar-accent-foreground: 222 47% 11%;
  --sidebar-border: 214 32% 91%;
  --sidebar-ring: 220 90% 56%;
  --neon-purple: 220 90% 56%;
  --neon-lime: 142 76% 36%;`,
    dark: `  --background: 220 14% 10%;
  --foreground: 210 40% 96%;
  --card: 222 47% 11%;
  --card-foreground: 210 40% 96%;
  --popover: 222 47% 11%;
  --popover-foreground: 210 40% 96%;
  --primary: 220 90% 56%;
  --primary-foreground: 0 0% 100%;
  --secondary: 217 33% 17%;
  --secondary-foreground: 210 40% 96%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 17%;
  --accent-foreground: 210 40% 96%;
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 217 33% 17%;
  --input: 217 33% 17%;
  --ring: 220 90% 56%;
  --sidebar: 222 47% 8%;
  --sidebar-foreground: 215 20% 65%;
  --sidebar-primary: 220 90% 56%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 217 33% 17%;
  --sidebar-accent-foreground: 210 40% 96%;
  --sidebar-border: 217 33% 17%;
  --sidebar-ring: 220 90% 56%;`,
  },
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
