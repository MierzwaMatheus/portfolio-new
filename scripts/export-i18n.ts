export function serializeTranslations(obj: Record<string, unknown>, varName: string): string {
  function stringify(val: unknown, indent: number): string {
    const pad = "  ".repeat(indent);
    const innerPad = "  ".repeat(indent + 1);
    if (typeof val === "string") {
      return JSON.stringify(val);
    }
    if (typeof val === "object" && val !== null) {
      const entries = Object.entries(val as Record<string, unknown>);
      if (entries.length === 0) return "{}";
      const lines = entries.map(([k, v]) => `${innerPad}${k}: ${stringify(v, indent + 1)}`);
      return `{\n${lines.join(",\n")},\n${pad}}`;
    }
    return String(val);
  }
  return `export const ${varName} = ${stringify(obj, 0)};\n`;
}

export function unflattenTranslations(
  entries: Array<{ key: string; value: string }>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { key, value } of entries) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}
