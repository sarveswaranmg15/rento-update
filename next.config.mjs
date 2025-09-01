/** @type {import('next').NextConfig} */
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["pg", "pg-connection-string", "bcryptjs"],
  env: {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
  webpack: (config, { dev, isServer }) => {
    // Ensure CSS is extracted when required by build
    // Next.js normally handles CSS, but some setups can require explicit plugin.
    // Only add if not already present.
    const hasMiniCss = config.plugins?.some(
      (p) => p && p.constructor && p.constructor.name === "MiniCssExtractPlugin"
    );
    if (!hasMiniCss) {
      config.plugins = config.plugins || [];
      config.plugins.push(
        new MiniCssExtractPlugin({
          filename: dev
            ? "static/css/[name].css"
            : "static/css/[name].[contenthash].css",
          chunkFilename: dev
            ? "static/css/[id].css"
            : "static/css/[id].[contenthash].css",
        })
      );
    }
    return config;
  },
};

export default nextConfig;
