import { intro, outro, text, select, multiselect, confirm, isCancel, cancel } from "@clack/prompts";
import { identityPrompt } from "../prompts/identityPrompt.js";

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
