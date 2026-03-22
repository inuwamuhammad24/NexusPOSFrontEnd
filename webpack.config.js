const currentTask = process.env.npm_lifecycle_event
const path = require("path")
const Dotenv = require("dotenv-webpack")
const { CleanWebpackPlugin } = require("clean-webpack-plugin")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")

const isProduction = currentTask === "webpackBuild"

const config = {
  entry: "./app/Main.js",

  output: {
    publicPath: "/",
    path: path.resolve(__dirname, "dist"),
    filename: isProduction ? "[name].[contenthash].js" : "bundled.js",
    chunkFilename: isProduction
      ? "[name].[contenthash].js"
      : "[name].bundle.js",
  },

  mode: isProduction ? "production" : "development",

  devtool: isProduction ? false : "source-map",

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-react",
              [
                "@babel/preset-env",
                {
                  targets: "defaults",
                },
              ],
            ],
          },
        },
      },

      {
        test: /\.css$/i,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : "style-loader",
          "css-loader",
          "postcss-loader",
        ],
      },

      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: "asset/resource",
      },

      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/resource",
      },
    ],
  },

  plugins: [
    new Dotenv(),

    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "app/index-template.html",
    }),
  ],

  resolve: {
    extensions: [".js"],
    alias: {
      "@components": path.resolve(__dirname, "app/components"),
      "@pages": path.resolve(__dirname, "app/pages"),
      "@utils": path.resolve(__dirname, "app/utils"),
      "@hooks": path.resolve(__dirname, "app/hooks"),
      "@services": path.resolve(__dirname, "app/services"),
    },
  },
}

// ✅ Development settings
if (currentTask === "webpackDev" || currentTask === "dev") {
  config.devServer = {
    port: 3000,
    static: {
      directory: path.join(__dirname, "dist"),
    },
    hot: true,
    historyApiFallback: true,
    open: true,
  }
}

// ✅ Production settings
if (isProduction) {
  config.plugins.push(
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "styles.[contenthash].css",
    }),
  )
}

module.exports = config
