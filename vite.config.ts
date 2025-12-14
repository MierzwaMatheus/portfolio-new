import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import reactInspector from "vite-plugin-react-inspector";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Plugin para ajustar caminhos do react-inspector
 * Usado APENAS em desenvolvimento
 */
function transformInspectorPaths(): Plugin {
  const srcPath = path.resolve(import.meta.dirname, "client", "src");

  return {
    name: "transform-inspector-paths",
    enforce: "post",
    transform(code, id) {
      if (
        !isDev ||
        id.includes("node_modules") ||
        !code ||
        !code.includes("data-react-inspector")
      ) {
        return null;
      }

      const patterns = [
        /data-react-inspector\s*=\s*["']([^"']+)["']/g,
        /"data-react-inspector"\s*:\s*"([^"]+)"/g,
        /'data-react-inspector'\s*:\s*'([^']+)'/g,
      ];

      let modified = false;
      let transformedCode = code;

      for (const regex of patterns) {
        transformedCode = transformedCode.replace(regex, (match, fullPath) => {
          const parts = fullPath.split(":");
          const filePath = parts[0];
          const location = parts.slice(1).join(":");

          if (filePath && filePath.startsWith(srcPath)) {
            const relativePath = path.relative(srcPath, filePath);
            const newPath = `src/${relativePath}${location ? ":" + location : ""}`;
            modified = true;
            return match.replace(fullPath, newPath);
          }

          return match;
        });
      }

      return modified ? { code: transformedCode, map: null } : null;
    },
  };
}

export default defineConfig({
  root: path.resolve(import.meta.dirname, "client"),

  envDir: path.resolve(import.meta.dirname, "client"),

  plugins: [
    react(),
    tailwindcss(),
    vitePluginManusRuntime(),

    // Debug only
    isDev && reactInspector(),
    isDev && transformInspectorPaths(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },

  build: {
    outDir: "dist",        // gera client/dist (correto pra Vercel)
    emptyOutDir: true,
    sourcemap: isDev,
  },

  server: {
    port: 3000,
    host: true,
    strictPort: false,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
