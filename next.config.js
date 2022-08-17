// /** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");
// const runtimeCaching = require("./lib/cache.js");
const webpack = require("webpack");

const config = {
  pwa: {
    dest: "public",
    scope: '/',
    // runtimeCaching,
    // cacheStartUrl: false,
    dynamicStartUrl: true,
  },
  basePath: '/pwa',
  trailingSlash: true,
  extends: ["plugin:@next/next/recommended"],
};
module.exports = withPWA(config);

if (require.main === module) {
  config.plugins = [];
  const buildId = require("fs").readFileSync(".next/BUILD_ID").toString().trim()
  module.exports.webpack(config, {
    webpack,
    buildId,
    dev: false,
    distDir: "public",
    dir: __dirname,
    config,
  });
}
