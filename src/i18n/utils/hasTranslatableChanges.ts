export function getChangedTranslatableFields(
  newValues: Record<string, string>,
  existing: Record<string, { ptBR: string; enUS?: string } | undefined>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(newValues).filter(([key, newVal]) => {
      const saved = existing[key]?.ptBR ?? '';
      return newVal.trim() !== saved.trim();
    })
  );
}
