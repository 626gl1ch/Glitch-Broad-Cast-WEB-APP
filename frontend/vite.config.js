import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/Glitch-Broad-Cast-WEB-APP/",
  server: { port: 5173 },
});
