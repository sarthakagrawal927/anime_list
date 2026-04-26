import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".next", "build", ".wrangler", ".open-next", "node_modules", "out"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);
