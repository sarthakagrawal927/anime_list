import type { Config } from "jest";

const config: Config = {
  projects: [
    // Backend tests (Node environment)
    {
      displayName: "backend",
      testMatch: ["<rootDir>/src/**/*.test.ts"],
      transform: {
        "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
    },
    // Frontend tests (jsdom environment)
    {
      displayName: "frontend",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/components/**/*.test.tsx", "<rootDir>/lib/**/*.test.ts"],
      transform: {
        "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.test.json" }],
      },
      moduleNameMapper: {
        "^@/(.*)$": "<rootDir>/$1",
      },
    },
  ],
};

export default config;
