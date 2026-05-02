export function hasTranslatableChanges(
  newValues: Record<string, string>,
  existing: Record<string, { ptBR: string; enUS?: string } | undefined>
): boolean {
  return Object.entries(newValues).some(([key, newVal]) => {
    const saved = existing[key]?.ptBR ?? '';
    return newVal.trim() !== saved.trim();
  });
}
