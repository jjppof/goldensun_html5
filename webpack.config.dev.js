const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    devServer: {
        static: {
            directory: __dirname,
            watch: true,
        },
        compress: true,
        liveReload: true,
        open: true,
        port: 9000,
        watchFiles: {
            options: {
                ignored: [
                    path.resolve(__dirname, 'dist'),
                    path.resolve(__dirname, '.git'),
                    path.resolve(__dirname, 'code_docs'),
                    path.resolve(__dirname, 'scripts'),
                    path.resolve(__dirname, 'electron'),
                    path.resolve(__dirname, 'deploy'),
                    path.resolve(__dirname, 'logs'),
                    path.resolve(__dirname, 'package.json'),
                ],
            },
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.json"
                    }
                }],
                exclude: /node_modules/,
            },
        ],
    }
});
