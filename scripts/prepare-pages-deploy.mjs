import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const sourceDir = ".open-next";
const outputDir = ".pages-deploy";

const requiredPaths = [
  "assets",
  "cloudflare",
  "middleware",
  ".build",
  "server-functions",
  "worker.js",
];

for (const path of requiredPaths) {
  if (!existsSync(join(sourceDir, path))) {
    throw new Error(`Missing ${join(sourceDir, path)}. Run pnpm cf:build first.`);
  }
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(outputDir, { recursive: true });

cpSync(join(sourceDir, "assets"), outputDir, { recursive: true });
for (const path of ["cloudflare", "middleware", ".build", "server-functions"]) {
  cpSync(join(sourceDir, path), join(outputDir, path), { recursive: true });
}
cpSync(join(sourceDir, "worker.js"), join(outputDir, "_worker.js"));

writeFileSync(
  join(outputDir, "_routes.json"),
  `${JSON.stringify({
    version: 1,
    include: ["/*"],
    exclude: [
      "/_next/static/*",
      "/cdn-cgi/_next_cache/*",
      "/favicon.ico",
      "/icon.svg",
      "/og-image.png",
    ],
  })}\n`,
);
