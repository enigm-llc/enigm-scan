import { defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // Workers Builds shares CPU: concurrent jsdom suites can exceed 5 seconds.
      // Keep every assertion and test isolation while bounding contention.
      maxWorkers: 2,
      testTimeout: 15_000,
    },
  }),
);
