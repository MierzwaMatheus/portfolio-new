const GENERIC_SEGMENTS = new Set(["components", "pages", "src", "utils", "hooks", "lib"]);

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatPathToLabel(filePath: string): string {
  const parts = filePath.replace(/\.(tsx?|jsx?)$/, "").split("/");
  const name = parts[parts.length - 1];
  const parent = parts[parts.length - 2];
  if (parent && !GENERIC_SEGMENTS.has(parent)) {
    return `${capitalize(parent)} → ${name}`;
  }
  return name;
}
