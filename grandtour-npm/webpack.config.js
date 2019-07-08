const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        stats: "minimal",
        contentBase: './public',
    },
    entry: {
        main: './src/main.js',
    },
    node: {
        fs: 'empty'
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'the Grand Tour',
            template: "./src/index.html", 
            filename: "index.html", 
        }),
        new CopyWebpackPlugin([ { from: 'static/' } ])
    ],
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'public')
    },
    module: {
        rules: [
            {
                test: /\.bin$/,
                use: {loader: 'arraybuffer-loader'}
            }

        ]
    }
};
