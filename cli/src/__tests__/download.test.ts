import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { getLatestVersion } from "../utils/download.js";

const GITHUB_API = "https://api.github.com";

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("getLatestVersion", () => {
  it("retorna string semver a partir da GitHub API", async () => {
    server.use(
      http.get(`${GITHUB_API}/repos/matheusmierzwa/rubrica/releases/latest`, () =>
        HttpResponse.json({ tag_name: "v1.2.3" })
      )
    );

    const version = await getLatestVersion();
    expect(version).toBe("v1.2.3");
  });

  it("lança erro amigável quando GitHub API retorna 404", async () => {
    server.use(
      http.get(`${GITHUB_API}/repos/matheusmierzwa/rubrica/releases/latest`, () =>
        HttpResponse.json({ message: "Not Found" }, { status: 404 })
      )
    );

    await expect(getLatestVersion()).rejects.toThrow(/404/);
  });
});
