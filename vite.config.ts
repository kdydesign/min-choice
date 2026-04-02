import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/app-icon.svg"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024
      },
      devOptions: {
        enabled: true
      },
      manifest: {
        name: "Bebe Choice",
        short_name: "Bebe Choice",
        description: "12개월 아이의 하루 세끼 식단을 부드럽게 추천하는 모바일 우선 PWA",
        theme_color: "#ef8e78",
        background_color: "#fff7f2",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/app-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      }
    })
  ],
  server: {
    host: "0.0.0.0",
    port: 4173
  }
});
