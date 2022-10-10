const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
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
                path.resolve(__dirname, '.git'),
                path.resolve(__dirname, 'code_docs'),
                path.resolve(__dirname, 'scripts'),
                path.resolve(__dirname, 'electron'),
            ]
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
