import { describe, it, expect } from "vitest";
import { getChangedTranslatableFields } from "@/i18n/utils/hasTranslatableChanges";

describe("getChangedTranslatableFields", () => {
  it("includes a field when value changed (after trim)", () => {
    const result = getChangedTranslatableFields(
      { title: "New Title" },
      { title: { ptBR: "Old Title" } },
    );
    expect(result).toEqual({ title: "New Title" });
  });

  it("omits a field when value identical to existing (after trim)", () => {
    const result = getChangedTranslatableFields(
      { title: "Same  " },
      { title: { ptBR: "  Same" } },
    );
    expect(result).toEqual({});
  });

  it("includes a field when no existing entry is present", () => {
    const result = getChangedTranslatableFields(
      { title: "New" },
      {},
    );
    expect(result).toEqual({ title: "New" });
  });

  it("omits a field when newValue is empty AND existing entry is undefined", () => {
    const result = getChangedTranslatableFields(
      { title: "" },
      { title: undefined },
    );
    expect(result).toEqual({});
  });

  it("omits whitespace-only diff", () => {
    const result = getChangedTranslatableFields(
      { title: "  X  " },
      { title: { ptBR: "X" } },
    );
    expect(result).toEqual({});
  });

  it("returns multiple changed fields and omits unchanged", () => {
    const result = getChangedTranslatableFields(
      { title: "New", subtitle: "Same" },
      { title: { ptBR: "Old" }, subtitle: { ptBR: "Same" } },
    );
    expect(result).toEqual({ title: "New" });
  });

  it("returns empty object when all fields match", () => {
    expect(
      getChangedTranslatableFields(
        { a: "x", b: "y" },
        { a: { ptBR: "x" }, b: { ptBR: "y" } },
      ),
    ).toEqual({});
  });
});
