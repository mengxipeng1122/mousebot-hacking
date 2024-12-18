const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CopyPlugin = require('copy-webpack-plugin');

const serverConfig = {
  target: 'node',
  externals: [nodeExternals()],
  entry: './src/server.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

const clientConfig = {
  target: 'web',
  entry: {
    index: './src/client/index.ts',
    about: './src/client/about.ts',
    show_texture: './src/client/show_texture.ts',
    show_asset_static_model: './src/client/show_asset_static_model.ts',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist', 'public', 'scripts'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/public',
          to: path.resolve(__dirname, 'dist', 'public'),
        },
      ],
    }),
  ],
};

module.exports = [serverConfig, clientConfig]; 