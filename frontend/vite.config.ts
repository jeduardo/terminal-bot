import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { qrcode } from "vite-plugin-qrcode";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/",
  plugins: [qrcode(), react()],
  build: {
    outDir: "build",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
