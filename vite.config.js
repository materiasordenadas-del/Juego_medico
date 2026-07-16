import { defineConfig } from "vite";

// Rutas relativas para que el paquete también funcione desde index.html con file://.
export default defineConfig({
  base: "./",
});
