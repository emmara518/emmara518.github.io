#!/usr/bin/env node
/**
 * Standalone output preparation — runs automatically after `next build`.
 *
 * Next.js `output: "standalone"` does NOT copy static assets, public files,
 * or .env files into the standalone bundle. This script performs those copies
 * reproducibly so `npm start` (node .next/standalone/server.js) serves a
 * complete site without undocumented manual steps.
 */
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

if (!fs.existsSync(standalone)) {
  // Hosted platforms (e.g. Vercel) build with their own runtime and may not
  // emit a standalone bundle. Never fail the build because of that.
  console.log("standalone output not present — skipping packaging (hosted build)");
  process.exit(0);
}

function copyRecursive(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (fs.statSync(src).isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// 1. .next/static → .next/standalone/.next/static
const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");
fs.rmSync(staticDest, { recursive: true, force: true });
copyRecursive(staticSrc, staticDest);
console.log("copied .next/static");

// 2. public → .next/standalone/public
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");
fs.rmSync(publicDest, { recursive: true, force: true });
if (fs.existsSync(publicSrc)) copyRecursive(publicSrc, publicDest);
console.log("copied public/");

// 3. Environment files (never committed by git; copied locally if present)
for (const envFile of [".env.local", ".env"]) {
  const envSrc = path.join(root, envFile);
  if (fs.existsSync(envSrc)) {
    fs.copyFileSync(envSrc, path.join(standalone, envFile));
    console.log(`copied ${envFile}`);
  }
}

// 4. Native image-optimizer runtime: Next's tracing misses the libvips DLLs
//    inside @img/sharp-<platform> (native DLL deps are not traced). Without
//    them every /_next/image request 500s with ERR_DLOPEN_FAILED. Copy the
//    full platform packages over whatever standalone has.
const imgSrc = path.join(root, "node_modules", "@img");
if (fs.existsSync(imgSrc)) {
  const imgDest = path.join(standalone, "node_modules", "@img");
  for (const pkg of fs.readdirSync(imgSrc)) {
    copyRecursive(path.join(imgSrc, pkg), path.join(imgDest, pkg));
  }
  console.log("copied @img/* native packages (sharp runtime)");
}

console.log("standalone ready → npm start");
