import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "0.0.0.0",
    port: 5173,
  },

  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    globals: true,

    include: [
      "src/tests/**/*.test.js",
      "src/tests/**/*.test.jsx",
    ],

    exclude: [
      "node_modules/**",
      "dist/**",
      "e2e/**",
      "tests/**",
      "**/*.spec.js",
      "**/*.spec.jsx",
    ],
  },
});