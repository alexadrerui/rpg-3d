import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  transpilePackages: [
    "three",
    "@pascal-app/core",
    "@pascal-app/viewer",
    "@pascal-app/editor",
    "@rpg3d/schema",
    "@rpg3d/viewer",
    "@rpg3d/ui",
  ],
  turbopack: {
    resolveAlias: {
      react:                "./node_modules/react",
      "react-dom":          "./node_modules/react-dom",
      three:                "./node_modules/three",
      "@react-three/fiber": "./node_modules/@react-three/fiber",
      "@react-three/drei":  "./node_modules/@react-three/drei",
      zustand:              "./node_modules/zustand",
    },
  },
  experimental: {
    serverActions: { bodySizeLimit: "100mb" },
  },
}

export default nextConfig
