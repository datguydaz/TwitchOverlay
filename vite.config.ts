import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: "web",
  publicDir: "public",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        gameplay: resolve(__dirname, "web/gameplay.html"),
        "starting-soon": resolve(__dirname, "web/starting-soon.html"),
        brb: resolve(__dirname, "web/brb.html"),
        ending: resolve(__dirname, "web/ending.html"),
        avatar: resolve(__dirname, "web/avatar.html"),
        ultrawide: resolve(__dirname, "web/ultrawide.html"),
        "ultrawide-top": resolve(__dirname, "web/ultrawide-top.html"),
        "ultrawide-bottom": resolve(__dirname, "web/ultrawide-bottom.html"),
        dashboard: resolve(__dirname, "web/dashboard.html"),
        index: resolve(__dirname, "web/index.html"),
      },
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/ws": {
        target: "ws://127.0.0.1:8787",
        ws: true,
      },
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
  },
});
