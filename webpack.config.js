const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: {
    'code-de': ['babel-polyfill', './src/main.js'],
  },
  resolve: {
    modulesDirectories: ['web_modules', 'node_modules', 'bower_components'],
    alias: {
      // necessary to avoid multiple packings of backbone due to marionette
      backbone: path.join(__dirname, 'node_modules', 'backbone', 'backbone'),
      handlebars: 'handlebars/dist/handlebars.min.js',
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
    path: path.join(__dirname, 'dist'),
    filename: '[name].bundle.js',
    library: 'code-de',
    libraryTarget: 'umd',
  },
  devServer: {
    host: '0.0.0.0',
    inline: true
  },
  module: {
    loaders: [
      { test: /node_modules.*eoxc.*js$/, loader: 'babel-loader' },
      { test: /node_modules.*opensearch.*js$/, loader: 'babel-loader' },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.coffee$/, loader: 'coffee-loader' },
      { test: /\.litcoffee$/, loader: 'coffee-loader?literate' },
      { test: /\.css$/, loaders: ['style', 'css'] },
      { test: /\.less$/, loaders: ['style', 'css', 'less'] },
      { test: /\.hbs$/, loader: 'handlebars-loader?helperDirs[]=' + __dirname + '/src/helpers' },

      // for anything that might be included in a css
      { test: /\.(png|woff|woff2|eot|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=4000000' },
    ],
  },
  plugins: [
    new webpack.ResolverPlugin(
        new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin('.bower.json', ['main'])
    ),
    new webpack.optimize.DedupePlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
  ],
  cache: false,
};
