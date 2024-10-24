/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   taint: true,
  // },
  reactStrictMode: false,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "localhost:3001",
        // 'supreme-journey-69p7qp7x45r346jq-3000.app.github.dev', // Codespaces
      ],
    },
  },
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: "canvas" }]; // required to make Konva & react-konva work
    return config;
  },
};

export default nextConfig;
