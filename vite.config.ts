import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, strictPort: true },
  build: {
    sourcemap: false,
    // The largest chunk is the PDF export, which embeds the report typeface
    // and loads only when a report is saved.
    chunkSizeWarningLimit: 720,
    rollupOptions: {
      onwarn(warning, warn) {
        // Misplaced /*#__PURE__*/ comments inside dependencies are dropped
        // by Rollup with no effect on the bundle; report only our own.
        if (
          warning.code === "INVALID_ANNOTATION" &&
          warning.id?.includes("/node_modules/")
        )
          return;
        warn(warning);
      },
    },
  },
});
