console.log(`SERVER WEBPACK (${process.env.NODE_ENV})`)
const fs = require('fs')
const path = require('path')
const nodeExternals = require('webpack-node-externals')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
const GeneratePackageJsonPlugin = require('generate-package-json-webpack-plugin')
const appConfig = require('./config/app.json')
const createEnvironmentHash = require('./tools/createEnvironmentHash')
const getClientEnvironment = require('./tools/env')
const paths = require('./tools/paths')
const packageJson = require('./package.json')
const webpack = require('webpack')
const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1))
const mode = env.mode
const isDevelopment = env.isDevelopment

function getDefinedEnv() {
  const concerns = appConfig.envConcerns.reduce((acc, key) => {
    if (process.env[key]) {
      acc[`process.env.${key}`] = JSON.stringify(process.env[key])
    }
    return acc
  }, {})
  console.log('baked env vars:', concerns)
  return concerns
}

module.exports = {
  mode,
  entry: {
    index: './src/index.ts',
  },
  target: 'node',
  devtool: isDevelopment ? 'source-map' : false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].[contenthash].js',
  },
  externalsPresets: { node: true },
  externals: [
    nodeExternals({
      additionalModuleDirs: [path.resolve(__dirname, '../../node_modules')],
      allowlist: ['ieee754'],
      bufferutil: 'bufferutil', //allowList?
      'utf-8-validate': 'utf-8-validate',
    }),
  ],
  plugins: [
    new webpack.DefinePlugin(getDefinedEnv()),
    new ForkTsCheckerWebpackPlugin(),
    new NodePolyfillPlugin(),
    new GeneratePackageJsonPlugin({ ...packageJson, main: 'index.js' }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            projectReferences: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.json/,
        include: [path.resolve(__dirname, 'config')],
      },
    ],
  },
  resolve: {
    roots: [path.resolve(__dirname, 'src')],
    extensions: ['.tsx', '.ts', '.js'],
    plugins: [new TsconfigPathsPlugin({})],
  },
  cache: {
    type: 'filesystem',
    version: createEnvironmentHash(env.raw),
    cacheDirectory: paths.appWebpackCache,
    store: 'pack',
    buildDependencies: {
      defaultWebpack: ['webpack/lib/'],
      config: [__filename],
      tsconfig: [paths.appTsConfig, paths.appJsConfig].filter(f => fs.existsSync(f)),
    },
  },
}
