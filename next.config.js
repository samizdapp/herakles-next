// /** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");
const webpack = require("webpack");

const config = {
  pwa: {
    dest: "public",
    // runtimeCaching,
    // cacheStartUrl: false,
    // dynamicStartUrl: false,
  },
  // extends: ["plugin:@next/next/recommended"],
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
