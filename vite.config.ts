import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/app-icon.svg"],
      manifest: {
        name: "12개월 아이 하루 식단표",
        short_name: "아이 식단표",
        description: "아이별 재료와 알레르기를 반영해 하루 세끼 식단을 추천하는 PWA",
        theme_color: "#f08c78",
        background_color: "#fff8f5",
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
