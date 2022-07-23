// /** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");
const webpack = require("webpack");

const config = {
  pwa: {
    dest: "public",
    runtimeCaching,
    cacheStartUrl: false,
    dynamicStartUrl: false,
  },
  extends: ["plugin:@next/next/recommended"],
};
module.exports = withPWA(config);

if (require.main === module) {
  config.plugins = [];
  module.exports.webpack(config, {
    webpack,
    buildId: require("fs").readFileSync(".next/BUILD_ID"),
    dev: false,
    dir: __dirname,
    config,
  });
}
