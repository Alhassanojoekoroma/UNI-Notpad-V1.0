import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/helpers/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    exclude: ["tests/e2e/**"],
    pool: "forks",
    fileParallelism: false, // integration tests share a DB — avoid deadlocks
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.tsx",
        "src/components/**",
        "src/types/**",
        "src/hooks/**",
        "src/lib/auth.ts",
        "src/lib/auth.config.ts",
        "src/lib/prisma.ts",
        "src/lib/cloudinary.ts",
        "src/lib/resend.ts",
        "src/lib/payments/**",
        "src/lib/gemini.ts",
        "src/lib/elevenlabs.ts",
        "src/lib/purge-deleted-users.ts",
        "src/lib/types.ts",
        "src/lib/constants.ts",
      ],
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
