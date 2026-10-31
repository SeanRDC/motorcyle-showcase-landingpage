import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  // Relative so the build works from the GitHub Pages project subpath
  base: "./",
  plugins: [react(), tailwindcss()],
});
