const path = require('path');

module.exports = {
  entry: './base/GoldenSun.ts',
  devtool: 'inline-source-map',
  devServer: {
    contentBase: __dirname,
    watchContentBase: true,
    compress: true,
    liveReload: true,
    open: true,
    port: 9000,
    watchOptions: {
      ignored: [
        path.resolve(__dirname, 'dist'),
        '**/.*'
      ]
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ],
  },
  output: {
    filename: 'bundle.js',
    path: path.join(__dirname, 'dist'),
    publicPath: "/dist/",
  },
};