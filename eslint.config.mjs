import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Route tests intentionally use dynamic Prisma/Vitest mocks. Production
    // code keeps the strict no-explicit-any rule; test doubles are the narrow
    // exception because Prisma's generated delegate surface is not mockable as
    // one stable structural type.
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Development uses a custom distDir so production builds cannot invalidate
    // a running dev server. Treat it exactly like Next's default build output.
    ".next-dev/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
