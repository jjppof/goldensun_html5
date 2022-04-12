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
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist'),
        publicPath: "/dist/",
    },
};
