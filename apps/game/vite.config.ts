import { defineConfig } from "vite"
import react  from "@vitejs/plugin-react"
import path   from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    // Deduplicate react + three so Pascal viewer and game share the same instance
    dedupe: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei", "zustand"],
  },
  optimizeDeps: {
    // Pascal packages use 'use client' and need to be pre-bundled
    include: [
      "@pascal-app/core",
      "@pascal-app/viewer",
      "@pascal-app/editor",
    ],
    exclude: ["@react-three/rapier"],  // has wasm, skip pre-bundle
  },
  server: {
    port: 3002,
    // Proxy API calls to avoid CORS in dev
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "pascal-core":   ["@pascal-app/core"],
          "pascal-viewer": ["@pascal-app/viewer"],
          "three":         ["three"],
        },
      },
    },
  },
})
