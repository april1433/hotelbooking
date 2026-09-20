import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "randomuser.me" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000"] },
  },
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack(config, { isServer, dev }) {
    // Only obfuscate client-side bundles in production builds
    if (!dev && !isServer) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const WebpackObfuscator = require("webpack-obfuscator");
      config.plugins.push(
        new WebpackObfuscator(
          {
            // ── Obfuscation strength ────────────────────────────────────
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: false,        // keep false — breaks source maps
            disableConsoleOutput: true,    // hides console.log in prod
            identifierNamesGenerator: "hexadecimal",
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,          // keep false — breaks Next.js internals
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayCallsTransformThreshold: 0.75,
            stringArrayEncoding: ["base64"],
            stringArrayIndexShift: true,
            stringArrayRotate: true,
            stringArrayShuffle: true,
            stringArrayWrappersCount: 2,
            stringArrayWrappersChainedCalls: true,
            stringArrayWrappersParametersMaxCount: 4,
            stringArrayWrappersType: "function",
            stringArrayThreshold: 0.75,
            transformObjectKeys: true,
            unicodeEscapeSequence: false,  // keep false — increases bundle size too much
          },
          // Exclude Next.js runtime chunks from obfuscation (they must stay intact)
          ["**/node_modules/**", "**/_next/static/chunks/framework*", "**/_next/static/chunks/main*"]
        )
      );
    }
    return config;
  },
};

export default nextConfig;

