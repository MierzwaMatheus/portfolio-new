import { intro } from "@clack/prompts";
import { runCreate } from "./commands/create.js";

const [,, command, projectName] = process.argv;

intro("Rubrica CLI");

if (command === "create") {
  if (!projectName) {
    console.error("Uso: rubrica create <nome-do-projeto>");
    process.exit(1);
  }
  await runCreate(projectName, { projectsDir: process.cwd() });
} else {
  console.log("Comandos disponíveis: create <nome-do-projeto>");
}
