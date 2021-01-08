/* eslint-disable camelcase */
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";
// import { BundleAnalyzerPlugin } from "webpack-bundle-analyzer";

const isEnvProduction = process.env.NODE_ENV === "production";

module.exports = {
  entry: path.join(__dirname, "src", "index.js"),
  optimization: {
    minimize: isEnvProduction,
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
      chunks: "all",
    },
  },
  output: {
    path: path.join(__dirname, "build"),
    filename: "index.bundle.js",
  },
  mode: isEnvProduction ? "production" : "development",
  devtool: isEnvProduction ? "" : "inline-source-map",
  resolve: {
    modules: [path.resolve(__dirname, "src"), "node_modules"],
    extensions: [".js", ".jsx", ".json"],
  },
  devServer: {
    contentBase: path.join(__dirname, "src"),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: ["babel-loader"],
      },
      {
        test: /\.(css|scss)$/,
        use: [
          "style-loader", // creates style nodes from JS strings
          "css-loader", // translates CSS into CommonJS
          "sass-loader", // compiles Sass to CSS, using Node Sass by default
        ],
      },
      {
        test: /\.(jpg|jpeg|png|gif|mp3|svg)$/,
        loaders: ["file-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "index.html"),
      favicon: "./src/img/cropped-icon.png",
    }),
    new CompressionPlugin(),
    // new BundleAnalyzerPlugin(),
  ],
};
