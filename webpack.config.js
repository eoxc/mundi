const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    'code-de': './src/main.js',
  },
  resolve: {
    modulesDirectories: ['web_modules', 'node_modules', 'bower_components'],
    alias: {
      // necessary to avoid multiple packings of backbone due to marionette
      backbone: path.join(__dirname, 'node_modules', 'backbone', 'backbone'),
      // Bind version of jquery
      //jquery: path.join(__dirname, 'node_modules', 'jquery'),

      // Bind version of jquery-ui
      //'jquery-ui': path.join(__dirname, 'node_modules', 'jquery-ui'),

      // jquery-ui doesn't contain a index file
      // bind module to the complete module
    },
  },
  resolveLoader: {
    root: path.join(__dirname, 'node_modules'),
  },
  output: {
    path: './dist',
    filename: '[name].bundle.js',
    library: 'code-de',
    libraryTarget: 'umd',
  },
  module: {
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.json$/, exclude: /node_modules/, loader: 'json-loader' },
      { test: /\.coffee$/, exclude: /node_modules/, loader: 'coffee-loader' },
      { test: /\.css$/, loaders: ['style', 'css'] },
      { test: /\.less$/, loaders: ['style', 'css', 'less'] },
      { test: /\.hbs$/, loader: 'handlebars-loader' },

      // for anything that might be included in a css
      { test: /\.(png|woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=100000' },
    ],
  },
  plugins: [
    new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('.bower.json', ['main'])
    ),
    new webpack.optimize.DedupePlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery'
    })
  ],
  cache: false,
};
