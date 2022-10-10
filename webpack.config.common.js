const path = require('path');

module.exports = {
    entry: './base/GoldenSun.ts',
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.join(__dirname, 'dist'),
        publicPath: "/dist/",
    },
};
