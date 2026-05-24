import * as nodeFsPromises from "node:fs/promises";

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
  "editorial-cream": {
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
  --sidebar: 38 30% 94%;
  --sidebar-foreground: 24 8% 45%;
  --sidebar-primary: 35 90% 50%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 38 25% 90%;
  --sidebar-accent-foreground: 24 10% 10%;
  --sidebar-border: 35 20% 85%;
  --sidebar-ring: 35 90% 50%;
  --neon-purple: 35 90% 50%;
  --neon-lime: 45 93% 47%;
  --bg: #faf7f2;
  --text: #1a1614;
  --primary: #a855f7;
  --accent: #ef4444;`,
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
  "paper-noir": {
    root: `  --background: 0 0% 98%;
  --foreground: 0 0% 5%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 5%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 5%;
  --primary: 0 84% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 92%;
  --secondary-foreground: 0 0% 5%;
  --muted: 0 0% 92%;
  --muted-foreground: 0 0% 40%;
  --accent: 0 0% 92%;
  --accent-foreground: 0 0% 5%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 88%;
  --input: 0 0% 88%;
  --ring: 0 84% 50%;
  --sidebar: 0 0% 96%;
  --sidebar-foreground: 0 0% 40%;
  --sidebar-primary: 0 84% 50%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 0 0% 92%;
  --sidebar-accent-foreground: 0 0% 5%;
  --sidebar-border: 0 0% 88%;
  --sidebar-ring: 0 84% 50%;
  --neon-purple: 0 84% 50%;
  --neon-lime: 0 0% 20%;
  --bg: #f0eee9;
  --text: #0a0a0a;
  --primary: #ef4444;
  --accent: #3b82f6;`,
    dark: `  --background: 0 0% 5%;
  --foreground: 0 0% 95%;
  --card: 0 0% 8%;
  --card-foreground: 0 0% 95%;
  --popover: 0 0% 8%;
  --popover-foreground: 0 0% 95%;
  --primary: 0 84% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 12%;
  --secondary-foreground: 0 0% 95%;
  --muted: 0 0% 12%;
  --muted-foreground: 0 0% 60%;
  --accent: 0 0% 12%;
  --accent-foreground: 0 0% 95%;
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 15%;
  --input: 0 0% 15%;
  --ring: 0 84% 50%;
  --sidebar: 0 0% 3%;
  --sidebar-foreground: 0 0% 60%;
  --sidebar-primary: 0 84% 50%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 0 0% 12%;
  --sidebar-accent-foreground: 0 0% 95%;
  --sidebar-border: 0 0% 15%;
  --sidebar-ring: 0 84% 50%;`,
  },
  "midnight-blue": {
    root: `  --background: 222 47% 8%;
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
  --sidebar: 222 47% 6%;
  --sidebar-foreground: 215 20% 65%;
  --sidebar-primary: 220 90% 56%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 217 33% 17%;
  --sidebar-accent-foreground: 210 40% 96%;
  --sidebar-border: 217 33% 17%;
  --sidebar-ring: 220 90% 56%;
  --neon-purple: 220 90% 56%;
  --neon-lime: 190 90% 50%;
  --bg: #0a1224;
  --text: #e8e6e0;
  --primary: #06b6d4;
  --accent: #facc15;`,
    dark: `  --background: 220 14% 5%;
  --foreground: 210 40% 96%;
  --card: 222 47% 8%;
  --card-foreground: 210 40% 96%;
  --popover: 222 47% 8%;
  --popover-foreground: 210 40% 96%;
  --primary: 220 90% 56%;
  --primary-foreground: 0 0% 100%;
  --secondary: 217 33% 13%;
  --secondary-foreground: 210 40% 96%;
  --muted: 217 33% 13%;
  --muted-foreground: 215 20% 65%;
  --accent: 217 33% 13%;
  --accent-foreground: 210 40% 96%;
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 217 33% 13%;
  --input: 217 33% 13%;
  --ring: 220 90% 56%;
  --sidebar: 222 47% 3%;
  --sidebar-foreground: 215 20% 65%;
  --sidebar-primary: 220 90% 56%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 217 33% 13%;
  --sidebar-accent-foreground: 210 40% 96%;
  --sidebar-border: 217 33% 13%;
  --sidebar-ring: 220 90% 56%;`,
  },
  "solar-warm": {
    root: `  --background: 20 30% 8%;
  --foreground: 35 30% 92%;
  --card: 20 28% 11%;
  --card-foreground: 35 30% 92%;
  --popover: 20 28% 11%;
  --popover-foreground: 35 30% 92%;
  --primary: 25 95% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 20 25% 18%;
  --secondary-foreground: 35 30% 92%;
  --muted: 20 25% 18%;
  --muted-foreground: 30 15% 60%;
  --accent: 20 25% 18%;
  --accent-foreground: 35 30% 92%;
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 20 25% 18%;
  --input: 20 25% 18%;
  --ring: 25 95% 53%;
  --sidebar: 20 30% 6%;
  --sidebar-foreground: 30 15% 60%;
  --sidebar-primary: 25 95% 53%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 20 25% 18%;
  --sidebar-accent-foreground: 35 30% 92%;
  --sidebar-border: 20 25% 18%;
  --sidebar-ring: 25 95% 53%;
  --neon-purple: 25 95% 53%;
  --neon-lime: 45 93% 47%;
  --bg: #1a1410;
  --text: #f2ede4;
  --primary: #f97316;
  --accent: #facc15;`,
    dark: `  --background: 20 35% 5%;
  --foreground: 35 30% 92%;
  --card: 20 30% 8%;
  --card-foreground: 35 30% 92%;
  --popover: 20 30% 8%;
  --popover-foreground: 35 30% 92%;
  --primary: 25 95% 53%;
  --primary-foreground: 0 0% 100%;
  --secondary: 20 30% 13%;
  --secondary-foreground: 35 30% 92%;
  --muted: 20 30% 13%;
  --muted-foreground: 30 15% 60%;
  --accent: 20 30% 13%;
  --accent-foreground: 35 30% 92%;
  --destructive: 0 62% 50%;
  --destructive-foreground: 0 0% 100%;
  --border: 20 30% 13%;
  --input: 20 30% 13%;
  --ring: 25 95% 53%;
  --sidebar: 20 35% 3%;
  --sidebar-foreground: 30 15% 60%;
  --sidebar-primary: 25 95% 53%;
  --sidebar-primary-foreground: 0 0% 100%;
  --sidebar-accent: 20 30% 13%;
  --sidebar-accent-foreground: 35 30% 92%;
  --sidebar-border: 20 30% 13%;
  --sidebar-ring: 25 95% 53%;`,
  },
};

function replaceBlock(css: string, selector: string, newVars: string): string {
  const re = new RegExp(`(${selector.replace(".", "\\.")} \\{)[^}]*(\\})`, "s");
  return css.replace(re, `$1\n${newVars}\n$2`);
}

export async function applyTheme(
  options: { preset: string },
  cssPath: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  const theme = PRESETS[options.preset];
  if (!theme) {
    throw new Error(`applyTheme: preset "${options.preset}" não encontrado.`);
  }

  const css = await fsModule.readFile(cssPath, "utf-8");
  let updated = replaceBlock(css, ":root", theme.root);
  updated = replaceBlock(updated, ".dark", theme.dark);
  await fsModule.writeFile(cssPath, updated);
}
