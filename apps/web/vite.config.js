import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, "package.json"), "utf8"));
const buildTime = process.env.VITE_BUILD_TIME || new Date().toISOString();
const buildId = process.env.VITE_BUILD_ID || `${packageJson.version}-${buildTime.replace(/\D/g, "").slice(0, 14)}`;
const noStoreHeaders = {
  "Cache-Control": "no-store, max-age=0, must-revalidate",
  "Pragma": "no-cache",
  "Expires": "0"
};

export default defineConfig({
  envDir: path.resolve(__dirname, "../.."),
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
    "import.meta.env.VITE_BUILD_ID": JSON.stringify(buildId),
    "import.meta.env.VITE_BUILD_TIME": JSON.stringify(buildTime)
  },
  server: {
    headers: noStoreHeaders
  },
  preview: {
    headers: noStoreHeaders
  }
});
