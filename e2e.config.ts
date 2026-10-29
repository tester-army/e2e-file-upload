import { existsSync } from "node:fs";
import type { E2EConfig } from "e2e";
import { web } from "@e2e-dev/web";
import { gateway } from "ai";

// e2e loads no .env file itself.
const envFile = new URL(".env.local", import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);

export default {
  // The Vercel AI Gateway serves the model id and reads AI_GATEWAY_API_KEY, or the OIDC token of a linked Vercel project.
  agents: {
    default: {
      model: gateway("openai/gpt-6-luna-fast"),
      system: "You are a thorough QA agent. Verify every outcome.",
      context:
        "The page uploads one image to Vercel Blob: choose a file or drop it on the dropzone, then press Upload. A card then shows the uploaded file with a preview and a Download link.",
    },
  },
  targets: [
    {
      engine: web(),
      app: {
        url: process.env.APP_URL ?? "http://localhost:3000",
        // Or let the runner start the dev server (and reuse one already running on that URL):
        // command: { executable: "npm", args: ["run", "dev"], reuseExisting: true, log: ".e2e/logs/app.log" },
      },
    },
  ],
} satisfies E2EConfig;
