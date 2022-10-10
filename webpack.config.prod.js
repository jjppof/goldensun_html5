const { merge } = require('webpack-merge');
const common = require('./webpack.config.common.js');

module.exports = merge(common, {
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [{
                    loader: 'ts-loader',
                    options: {
                        configFile: "tsconfig.prod.json"
                    }
                }],
                exclude: /node_modules/,
            },
        ],
    }
});
