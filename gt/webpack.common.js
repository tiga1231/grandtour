const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const webpack = require('webpack');

module.exports = {
	entry: './src/js/main.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'main.js'
	},
	module: {
		rules: [
		{
			test: /\.js$/,
			exclude: /node_modules/,
			use: {
				loader: "babel-loader"
			}
		},
		{
			test: /\.html$/,
			use: [{
				loader: "html-loader",
				options: { minimize: true }
			}]
		},
		{
			test: /\.css$/,
			use: [MiniCssExtractPlugin.loader, "css-loader"]
		},
		{
      test: /\.glsl$/,
      use: {loader: 'webpack-glsl-loader'}
  	},
  	{
      test: /\.bin$/,
      use: {loader: 'arraybuffer-loader'}
    }
		]
	},
  plugins: [
	new HtmlWebPackPlugin({
		template: "./src/index.html",
		filename: "./index.html"
	}),
    new MiniCssExtractPlugin({
		filename: "[name].css",
		chunkFilename: "[id].css"
    })
  ]

};