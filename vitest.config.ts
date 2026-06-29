import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `import "server-only"` throws outside an RSC build; stub it so server
      // modules (deals.ts, buyer-auth.ts, …) can be imported in unit tests.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  // Match the app's automatic JSX runtime so components transform without a
  // classic `import React` (they don't have one) — needed to server-render
  // them in tests.
  esbuild: { jsx: "automatic" },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    environment: "node",
  },
});
