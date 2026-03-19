const { GenerateSW } = require("workbox-webpack-plugin");

module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.plugins.push(
        new GenerateSW({
          swDest: "sw.js",
        })
      );
    }
    return config;
  },
};
