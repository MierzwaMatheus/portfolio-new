import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

vi.mock("@convex-dev/auth/server", () => ({
  convexAuth: () => ({ auth: {}, signIn: vi.fn(), signOut: vi.fn(), store: vi.fn(), isAuthenticated: vi.fn() }),
  getAuthUserId: vi.fn(),
  createAccount: vi.fn(),
  modifyAccountCredentials: vi.fn(),
}));

vi.mock("@convex-dev/auth/providers/Password", () => ({ Password: () => ({}) }));

import { runTranslateBatch } from "../../convex/translation";

const FAKE_KEY = "test-api-key";

function makeOkResponse(content: string) {
  return {
    ok: true,
    json: async () => ({ choices: [{ message: { content } }] }),
    text: async () => "",
  };
}

function makeErrorResponse(status: number, body = "error") {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => body,
  };
}

describe("runTranslateBatch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("traduz com sucesso no primeiro modelo sem retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse("Hello world"));
    vi.stubGlobal("fetch", fetchMock);

    const promise = runTranslateBatch(["Olá mundo"], FAKE_KEY);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.translatedTexts).toEqual(["Hello world"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retorna string vazia para textos vazios sem chamar API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse("x"));
    vi.stubGlobal("fetch", fetchMock);

    const promise = runTranslateBatch(["", "  "], FAKE_KEY);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.translatedTexts).toEqual(["", ""]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("faz retry e usa segundo modelo quando o primeiro retorna 429", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse(429))  // modelo 1, tentativa 1
      .mockResolvedValueOnce(makeErrorResponse(429))  // modelo 1, tentativa 2
      .mockResolvedValue(makeOkResponse("Hello"));    // modelo 2 (sucesso)

    vi.stubGlobal("fetch", fetchMock);

    const promise = runTranslateBatch(["Olá"], FAKE_KEY);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.translatedTexts).toEqual(["Hello"]);
    // 2 tentativas no modelo 1 + 1 no modelo 2
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("pula para o próximo modelo imediatamente em erro permanente (400)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeErrorResponse(400))  // modelo 1, sem retry
      .mockResolvedValue(makeOkResponse("Hello"));    // modelo 2 (sucesso)

    vi.stubGlobal("fetch", fetchMock);

    const promise = runTranslateBatch(["Olá"], FAKE_KEY);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.translatedTexts).toEqual(["Hello"]);
    // apenas 1 tentativa no modelo 1 (sem retry) + 1 no modelo 2
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retorna texto original quando todos os modelos falham", async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeErrorResponse(429));
    vi.stubGlobal("fetch", fetchMock);

    const promise = runTranslateBatch(["Olá"], FAKE_KEY);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.translatedTexts).toEqual(["Olá"]);
  });

  it("traduz múltiplos textos em paralelo, cada um com fallback independente", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeOkResponse("Hello"))  // texto 1, modelo 1
      .mockResolvedValueOnce(makeErrorResponse(429))   // texto 2, modelo 1, tentativa 1
      .mockResolvedValueOnce(makeErrorResponse(429))   // texto 2, modelo 1, tentativa 2
      .mockResolvedValue(makeOkResponse("World"));     // texto 2, modelo 2

    vi.stubGlobal("fetch", fetchMock);

    const promise = runTranslateBatch(["Olá", "Mundo"], FAKE_KEY);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.translatedTexts).toEqual(["Hello", "World"]);
  });
});
