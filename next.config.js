// /** @type {import('next').NextConfig} */
const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = withPWA({
  pwa: {
    dest: "public",
    runtimeCaching,
  },
  extends: ["plugin:@next/next/recommended"],
});
