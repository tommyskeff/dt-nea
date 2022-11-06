import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        "index": resolve(__dirname, "index.html"),
        "404": resolve(__dirname, "404.html")
      }
    }
  }
});