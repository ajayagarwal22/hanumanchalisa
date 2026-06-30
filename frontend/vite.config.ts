import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During dev, proxy API calls to the FastAPI backend on :7700.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 7701,
    proxy: {
      "/api": "http://127.0.0.1:7700",
    },
  },
  preview: {
    port: 7701,
  },
  build: {
    outDir: "dist",
  },
});
