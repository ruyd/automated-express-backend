console.log(`SERVER WEBPACK (${process.env.NODE_ENV})`)
const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin')
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')

const createEnvironmentHash = require('./tools/createEnvironmentHash')
const getClientEnvironment = require('./tools/env')
const paths = require('./tools/paths')
const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1))
const mode = process.env.NODE_ENV || 'production'
const isDevelopment = mode === 'development'

module.exports = {
  mode,
  entry: {
    index: './src/index.ts',
  },
  devtool: isDevelopment ? 'source-map' : false,
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    chunkFilename: '[name].[contenthash].js',
  },
  externalsPresets: { node: true },
  externals: [
    nodeExternals({
      // uncomment for monorepos
      // additionalModuleDirs: [path.resolve(__dirname, '../node_modules')],
    }),
  ],
  plugins: [
    new NodePolyfillPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
      },
    }),
    new ForkTsCheckerWebpackPlugin(),
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
