import { describe, it, expect } from "vitest";
import { generateJwtKeys } from "../utils/generateJwtKeys.js";

describe("generateJwtKeys", () => {
  it("retorna objeto com JWT_PRIVATE_KEY e JWKS", async () => {
    const result = await generateJwtKeys();
    expect(result).toHaveProperty("JWT_PRIVATE_KEY");
    expect(result).toHaveProperty("JWKS");
  });

  it("JWT_PRIVATE_KEY começa com '-----BEGIN PRIVATE KEY-----'", async () => {
    const { JWT_PRIVATE_KEY } = await generateJwtKeys();
    expect(JWT_PRIVATE_KEY.trimStart()).toMatch(/^-----BEGIN PRIVATE KEY-----/);
  });

  it("JWT_PRIVATE_KEY termina com '-----END PRIVATE KEY-----'", async () => {
    const { JWT_PRIVATE_KEY } = await generateJwtKeys();
    expect(JWT_PRIVATE_KEY.trimEnd()).toMatch(/-----END PRIVATE KEY-----\n?$/);
  });
});
