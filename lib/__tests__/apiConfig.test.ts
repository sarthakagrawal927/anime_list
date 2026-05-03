import { getApiUrl, LOCAL_API_URL, PRODUCTION_API_URL } from "../apiConfig";

const originalEnv = process.env.NEXT_PUBLIC_API_URL;
const originalNodeEnv = process.env.NODE_ENV;

describe("getApiUrl", () => {
  afterEach(() => {
    process.env.NEXT_PUBLIC_API_URL = originalEnv;
    Object.defineProperty(process.env, "NODE_ENV", {
      configurable: true,
      value: originalNodeEnv,
    });
  });

  it("uses configured deployment API URL when present", () => {
    process.env.NEXT_PUBLIC_API_URL = `${PRODUCTION_API_URL}/`;

    expect(getApiUrl("anime-list-9lk.pages.dev")).toBe(PRODUCTION_API_URL);
  });

  it("falls back to production API on deployed hosts", () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getApiUrl("anime-list-9lk.pages.dev")).toBe(PRODUCTION_API_URL);
  });

  it("uses localhost only for local browser development", () => {
    delete process.env.NEXT_PUBLIC_API_URL;

    expect(getApiUrl("localhost")).toBe(LOCAL_API_URL);
  });

  it("does not fall back to localhost in production", () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    Object.defineProperty(process.env, "NODE_ENV", {
      configurable: true,
      value: "production",
    });

    expect(getApiUrl("localhost")).toBe(PRODUCTION_API_URL);
  });
});
