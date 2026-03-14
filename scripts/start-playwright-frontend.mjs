import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendDir = resolve(__dirname, "..");

const child = spawn("npx", ["vite", "preview", "--port", "4173", "--host", "127.0.0.1"], {
  cwd: frontendDir,
  stdio: "inherit",
});

process.on("SIGTERM", () => child.kill());
process.on("SIGINT", () => child.kill());
