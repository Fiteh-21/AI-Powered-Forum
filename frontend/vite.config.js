import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Must match the backend CORS origin — the backend's FRONTEND_URL
    // (backend/.env / .env.example), which is http://localhost:5001 for dev.
    // strictPort makes Vite FAIL instead of silently bumping to 5002+, which CORS
    // would then block and surface as "Unable to connect to server".
    port: 5001,
    strictPort: true,
  },
  plugins: [react()],
});
