const fs = require("fs");
const path = require("path");
const webpack = require("webpack");
const resolve = require("resolve");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CaseSensitivePathsPlugin = require("case-sensitive-paths-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const TerserPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const InterpolateHtmlPlugin = require("react-dev-utils/InterpolateHtmlPlugin");
const getCSSModuleLocalIdent = require("react-dev-utils/getCSSModuleLocalIdent");
const ESLintPlugin = require("eslint-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("react-dev-utils/ForkTsCheckerWebpackPlugin");
const paths = require("./paths");
const getClientEnvironment = require("./env");
const { createHash } = require("crypto");

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;

const createEnvironmentHash = env => {
  const hash = createHash("md5");
  hash.update(JSON.stringify(env));
  return hash.digest("hex");
};

module.exports = function (webpackEnv) {
  const isEnvDevelopment = webpackEnv === "development";
  const isEnvProduction = webpackEnv === "production";

  const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

  const getStyleLoaders = (cssOptions, moduleOptions = {}) => {
    return [
      isEnvDevelopment && require.resolve("style-loader"),
      isEnvProduction && {
        loader: MiniCssExtractPlugin.loader,
        options: paths.publicUrlOrPath.startsWith(".") ? { publicPath: "../../" } : {},
      },
      {
        loader: require.resolve("css-loader"),
        options: {
          ...cssOptions,
          modules: {
            ...moduleOptions,
            namedExport: false,
          },
        },
      },
      {
        loader: require.resolve("postcss-loader"),
        options: {
          postcssOptions: {
            ident: "postcss",
            config: false,
            plugins: [
              "postcss-flexbugs-fixes",
              ["postcss-preset-env", { autoprefixer: { flexbox: "no-2009" }, stage: 3 }],
              "postcss-normalize",
            ],
          },
          sourceMap: isEnvDevelopment,
        },
      },
    ].filter(Boolean);
  };

  return {
    target: ["browserslist"],
    stats: "errors-warnings",
    mode: isEnvProduction ? "production" : "development",
    bail: isEnvProduction,
    devtool: isEnvProduction ? false : "cheap-module-source-map",
    entry: paths.appIndexJs,
    output: {
      path: paths.appBuild,
      pathinfo: isEnvDevelopment,
      filename: isEnvProduction ? "static/js/[name].[contenthash:8].js" : "static/js/bundle.js",
      chunkFilename: isEnvProduction ? "static/js/[name].[contenthash:8].chunk.js" : "static/js/[name].chunk.js",
      assetModuleFilename: "static/media/[name].[hash][ext]",
      publicPath: paths.publicUrlOrPath,
      devtoolModuleFilenameTemplate: isEnvProduction
          ? info => path.relative(paths.appSrc, info.absoluteResourcePath).replace(/\\/g, "/")
          : info => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/"),
    },
    cache: {
      type: "filesystem",
      version: createEnvironmentHash(env.raw),
      cacheDirectory: paths.appWebpackCache,
      store: "pack",
      buildDependencies: {
        defaultWebpack: ["webpack/lib/"],
        config: [__filename],
        tsconfig: [paths.appTsConfig].filter(f => fs.existsSync(f)),
      },
    },
    infrastructureLogging: { level: "none" },
    optimization: {
      minimize: isEnvProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            parse: { ecma: 8 },
            compress: { ecma: 5, warnings: false, comparisons: false, inline: 2 },
            mangle: { safari10: true },
            output: { ecma: 5, comments: false, ascii_only: true },
          },
        }),
        new CssMinimizerPlugin(),
      ],
    },
    resolve: {
      modules: ["node_modules", paths.appNodeModules, paths.appSrc],
      extensions: [".web.mjs", ".mjs", ".web.js", ".js", ".web.ts", ".ts", ".web.tsx", ".tsx", ".json", ".web.jsx", ".jsx"],
      alias: {
        "react-native": "react-native-web",
      },
    },
    module: {
      strictExportPresence: true,
      rules: [
        {
          oneOf: [
            {
              test: [/\.avif$/, /\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
              type: "asset",
              parser: { dataUrlCondition: { maxSize: parseInt(process.env.IMAGE_INLINE_SIZE_LIMIT || "10000") } },
            },
            {
              test: /\.svg$/,
              resourceQuery: /react/,
              use: [
                {
                  loader: require.resolve("@svgr/webpack"),
                  options: {
                    prettier: false,
                    svgo: false,
                    svgoConfig: {
                      plugins: [{ removeViewBox: false }],
                    },
                    titleProp: true,
                    ref: true,
                  },
                },
              ],
              issuer: {
                and: [/\.(ts|tsx|js|jsx|md|mdx)$/],
              },
            },
            {
              test: /\.svg$/,
              type: "asset/resource",
              generator: {
                filename: "static/media/[name].[hash][ext]",
              },
            },
            {
              test: /\.(js|mjs|jsx|ts|tsx)$/,
              include: paths.appSrc,
              loader: require.resolve("babel-loader"),
              options: {
                customize: require.resolve("babel-preset-react-app/webpack-overrides"),
                presets: [[require.resolve("babel-preset-react-app"), { runtime: "automatic" }]],
                cacheDirectory: true,
                cacheCompression: false,
                compact: isEnvProduction,
              },
            },
            {
              test: /\.(js|mjs)$/,
              exclude: /@babel(?:\/|\\{1,2})runtime/,
              loader: require.resolve("babel-loader"),
              options: {
                babelrc: false,
                configFile: false,
                compact: false,
                presets: [[require.resolve("babel-preset-react-app/dependencies"), { helpers: true }]],
                cacheDirectory: true,
                cacheCompression: false,
                sourceMaps: isEnvDevelopment,
                inputSourceMap: isEnvDevelopment,
              },
            },
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              use: getStyleLoaders(
                  { importLoaders: 1, sourceMap: isEnvDevelopment },
                  { mode: "icss" }
              ),
            },
            {
              test: cssModuleRegex,
              use: getStyleLoaders(
                  { importLoaders: 1, sourceMap: isEnvDevelopment },
                  { mode: "local", getLocalIdent: getCSSModuleLocalIdent }
              ),
            },
            {
              exclude: [/^$/, /\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
              type: "asset/resource",
            },
          ],
        },
      ].filter(Boolean),
    },
    plugins: [
      new HtmlWebpackPlugin(
          Object.assign(
              {},
              { inject: true, template: paths.appHtml },
              isEnvProduction ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  removeRedundantAttributes: true,
                  useShortDoctype: true,
                  removeEmptyAttributes: true,
                  removeStyleLinkTypeAttributes: true,
                  keepClosingSlash: true,
                  minifyJS: true,
                  minifyCSS: true,
                  minifyURLs: true,
                },
              } : undefined
          )
      ),
      isEnvProduction && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime-.+[.]js/]),
      new InterpolateHtmlPlugin(HtmlWebpackPlugin, env.raw),
      new webpack.DefinePlugin(env.stringified),
      isEnvDevelopment && new CaseSensitivePathsPlugin(),
      isEnvProduction && new MiniCssExtractPlugin({
        filename: "static/css/[name].[contenthash:8].css",
        chunkFilename: "static/css/[name].[contenthash:8].chunk.css",
      }),
      new WebpackManifestPlugin({
        fileName: "asset-manifest.json",
        publicPath: paths.publicUrlOrPath,
        generate: (seed, files, entrypoints) => {
          const manifestFiles = files.reduce((manifest, file) => {
            manifest[file.name] = file.path;
            return manifest;
          }, seed);
          const entrypointFiles = entrypoints.main.filter(fileName => !fileName.endsWith(".map"));
          return { files: manifestFiles, entrypoints: entrypointFiles };
        },
      }),
      new ForkTsCheckerWebpackPlugin({
        async: isEnvDevelopment,
        typescript: {
          typescriptPath: resolve.sync("typescript", { basedir: paths.appNodeModules }),
          configOverwrite: {
            compilerOptions: {
              sourceMap: isEnvDevelopment,
              skipLibCheck: true,
              inlineSourceMap: false,
              declarationMap: false,
              noEmit: true,
              incremental: true,
              tsBuildInfoFile: paths.appTsBuildInfoFile,
            },
          },
          context: paths.appPath,
          diagnosticOptions: { syntactic: true },
          mode: "write-references",
        },
        issue: {
          include: [{ file: "../**/src/**/*.{ts,tsx}" }, { file: "**/src/**/*.{ts,tsx}" }],
          exclude: [{ file: "**/src/**/__tests__/**" }, { file: "**/src/**/?(*.){spec|test}.*" }, { file: "**/src/setupProxy.*" }, { file: "**/src/setupTests.*" }],
        },
        logger: { infrastructure: "silent" },
      }),
      new ESLintPlugin({
        extensions: ["js", "mjs", "jsx", "ts", "tsx"],
        formatter: require.resolve("react-dev-utils/eslintFormatter"),
        eslintPath: require.resolve("eslint"),
        context: paths.appSrc,
        cache: true,
        cacheLocation: path.resolve(paths.appNodeModules, ".cache/.eslintcache"),
        cwd: paths.appPath,
        resolvePluginsRelativeTo: __dirname,
        failOnError: !isEnvDevelopment,
        emitWarning: isEnvDevelopment,
        baseConfig: {
          extends: [require.resolve("eslint-config-react-app/base")],
        },
      }),
    ].filter(Boolean),
    performance: false,
  };
};
