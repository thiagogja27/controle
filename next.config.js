const { GenerateSW } = require("workbox-webpack-plugin");

module.exports = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
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
