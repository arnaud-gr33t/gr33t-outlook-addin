/* eslint-disable @typescript-eslint/no-var-requires */
const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const urlDev = "https://localhost:3000/";
const urlProd = "https://arnaud-gr33t.github.io/gr33t-outlook-addin/";

async function getHttpsOptions() {
  const httpsOptions = await devCerts.getHttpsServerOptions();
  return { ca: httpsOptions.ca, key: httpsOptions.key, cert: httpsOptions.cert };
}

module.exports = async (env, options) => {
  const dev = options.mode === "development";
  const config = {
    devtool: "source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      taskpane: ["./src/taskpane/index.tsx", "./src/taskpane/taskpane.html"],
      commands: "./src/commands/commands.html",
      auth: ["./src/auth/auth.ts", "./src/auth/auth.html"],
      dashboard: ["./src/dashboard/index.tsx", "./src/dashboard/dashboard.html"],
    },
    output: {
      clean: true,
      path: path.resolve(__dirname, "dist"),
      // Cache-busting : nom de fichier avec content hash en prod uniquement.
      // En dev on garde des noms stables pour le hot reload.
      filename: dev ? "[name].js" : "[name].[contenthash:8].js",
    },
    resolve: {
      extensions: [".ts", ".tsx", ".html", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "ts-loader",
          },
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: "html-loader",
        },
        {
          // CSS modules : *.module.css → classes scopées
          test: /\.module\.css$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                // css-loader v7 : il faut désactiver namedExport pour garder
                // la compatibilité `import styles from "./X.module.css"`.
                esModule: true,
                modules: {
                  namedExport: false,
                  exportLocalsConvention: "as-is",
                  localIdentName: dev ? "[name]__[local]" : "[hash:base64:8]",
                },
              },
            },
          ],
        },
        {
          // CSS global : tous les autres *.css (tokens.css, global.css)
          test: /\.css$/,
          exclude: /\.module\.css$/,
          use: ["style-loader", "css-loader"],
        },
        {
          test: /\.(png|jpg|jpeg|ttf|woff|woff2|gif|ico)$/,
          type: "asset/resource",
          generator: {
            filename: "assets/[name][ext][query]",
          },
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        filename: "taskpane.html",
        template: "./src/taskpane/taskpane.html",
        chunks: ["polyfill", "taskpane"],
      }),
      new HtmlWebpackPlugin({
        filename: "commands.html",
        template: "./src/commands/commands.html",
        chunks: ["commands"],
      }),
      new HtmlWebpackPlugin({
        filename: "auth.html",
        template: "./src/auth/auth.html",
        chunks: ["polyfill", "auth"],
      }),
      new HtmlWebpackPlugin({
        filename: "dashboard.html",
        template: "./src/dashboard/dashboard.html",
        chunks: ["polyfill", "dashboard"],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: "assets/*",
            to: "assets/[name][ext][query]",
          },
          {
            from: "manifest*.xml",
            to: "[name]" + "[ext]",
            transform(content) {
              if (dev) {
                return content;
              } else {
                return content.toString().replace(new RegExp(urlDev, "g"), urlProd);
              }
            },
          },
        ],
      }),
    ],
    devServer: {
      hot: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      server: {
        type: "https",
        options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions(),
      },
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};
