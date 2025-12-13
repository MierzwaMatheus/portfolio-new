import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import type { Plugin } from "vite";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import reactInspector from "vite-plugin-react-inspector";

// Plugin para transformar caminhos absolutos em relativos a partir de src
function transformInspectorPaths(): Plugin {
  const srcPath = path.resolve(import.meta.dirname, "client", "src");
  
  return {
    name: "transform-inspector-paths",
    enforce: "post", // Executar após o react-inspector
    transform(code, id) {
      // Ignorar node_modules e arquivos que não contêm o atributo
      if (id.includes("node_modules") || !code || !code.includes("data-react-inspector")) {
        return null;
      }

      // Padrão mais abrangente para capturar data-react-inspector
      // Pode estar em diferentes formatos: strings, template literals, etc.
      const patterns = [
        // Formato padrão: data-react-inspector="caminho"
        /data-react-inspector\s*=\s*["']([^"']+)["']/g,
        // Formato sem espaços: data-react-inspector="caminho"
        /data-react-inspector=["']([^"']+)["']/g,
        // Formato em objetos JSX
        /"data-react-inspector"\s*:\s*"([^"]+)"/g,
        /'data-react-inspector'\s*:\s*'([^']+)'/g,
      ];
      
      let modified = false;
      let transformedCode = code;

      for (const regex of patterns) {
        transformedCode = transformedCode.replace(regex, (match, fullPath) => {
          // Extrair o caminho do arquivo e linha/coluna
          const parts = fullPath.split(":");
          const filePath = parts[0];
          const location = parts.slice(1).join(":");
          
          // Converter caminho absoluto para relativo a partir de src
          if (filePath && filePath.startsWith(srcPath)) {
            const relativePath = path.relative(srcPath, filePath);
            // Adicionar prefixo "src/" ao caminho
            const newPath = `src/${relativePath}${location ? ":" + location : ""}`;
            modified = true;
            // Manter o formato original
            return match.replace(fullPath, newPath);
          }
          
          return match;
        });
      }

      return modified ? { code: transformedCode, map: null } : null;
    },
  };
}

const plugins = [
  react({
    babel: {
      plugins: [
        // Plugin Babel personalizado para transformar caminhos do inspector
        // Este plugin deve executar APÓS o plugin do react-inspector
        function () {
          const srcPath = path.resolve(import.meta.dirname, "client", "src");
          const pathModule = path;
          
          return {
            name: "babel-plugin-transform-inspector-paths",
            visitor: {
              JSXAttribute(babelPath: any) {
                const attrName = babelPath.node.name;
                const isInspectorAttr = 
                  (attrName?.name === "data-react-inspector") ||
                  (attrName?.type === "JSXIdentifier" && attrName.name === "data-react-inspector");
                
                if (isInspectorAttr) {
                  // Verificar se é uma string literal
                  if (babelPath.node.value?.type === "StringLiteral") {
                    const fullPath = babelPath.node.value.value;
                    const parts = fullPath.split(":");
                    const filePath = parts[0];
                    const location = parts.slice(1).join(":");
                    
                    if (filePath && filePath.startsWith(srcPath)) {
                      const relativePath = pathModule.relative(srcPath, filePath);
                      // Adicionar prefixo "src/" ao caminho
                      const newPath = `src/${relativePath}${location ? ":" + location : ""}`;
                      babelPath.node.value.value = newPath;
                    }
                  }
                  // Verificar se é uma expressão JavaScript (template literal ou concatenação)
                  else if (babelPath.node.value?.type === "JSXExpressionContainer") {
                    const expr = babelPath.node.value.expression;
                    // Se for uma string literal dentro de uma expressão
                    if (expr?.type === "StringLiteral") {
                      const fullPath = expr.value;
                      const parts = fullPath.split(":");
                      const filePath = parts[0];
                      const location = parts.slice(1).join(":");
                      
                      if (filePath && filePath.startsWith(srcPath)) {
                        const relativePath = pathModule.relative(srcPath, filePath);
                        // Adicionar prefixo "src/" ao caminho
                        const newPath = `src/${relativePath}${location ? ":" + location : ""}`;
                        expr.value = newPath;
                      }
                    }
                  }
                }
              },
            },
          };
        },
      ],
    },
  }),
  tailwindcss(),
  vitePluginManusRuntime(),
  reactInspector(),
  transformInspectorPaths(),
];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
