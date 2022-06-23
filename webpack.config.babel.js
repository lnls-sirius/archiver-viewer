/* eslint-disable camelcase */
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CompressionPlugin from "compression-webpack-plugin";

const isEnvProduction = process.env.NODE_ENV === "production";

const optimization = {
  minimize: isEnvProduction && false,
  splitChunks: {
    chunks: "all",
    maxInitialRequests: Infinity,
    minSize: 0,
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name(module) {
          /* get the name. E.g. node_modules/packageName/not/this/part.js or node_modules/packageName */
          const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];

          /* npm package names are URL-safe, but some servers don't like @ symbols */
          return `npm.${packageName.replace("@", "")}`;
        },
      },
    },
  },
};

export default {
  entry: {
    index: path.join(__dirname, "src/index.tsx"),
  },
  optimization,
  output: {
    path: path.join(__dirname, "build"),
    filename: isEnvProduction ? "[name].min.js" : "[name].min.js",
    sourceMapFilename: isEnvProduction ? "[name].min.js.map" : "[name].js.map",
  },
  mode: isEnvProduction ? "production" : "development",
  devtool: isEnvProduction ? "source-map" : "inline-source-map",
  resolve: {
    modules: [path.resolve(__dirname, "src"), "node_modules"],
    extensions: [".js", ".jsx", ".json", ".tsx", ".ts"],
  },
  devServer: {
    static: path.join(__dirname, "src")
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
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
        use: ["file-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, "src", "index.html"),
      favicon: "./src/img/cropped-icon.png",
    }),
    new CompressionPlugin(),
  ],
};
