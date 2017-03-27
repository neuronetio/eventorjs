let webpack = require("webpack");
module.exports = {
    entry: './index.js',
    output: {
        path: './',
        filename: 'eventor.browser.js'
    },
    module: {
         loaders: [{
             test: /\.js$/,
             //exclude: /node_modules/,
             loader: 'babel-loader',
             query:{
               "presets": ["es2015"]
             }
         }]
     },
};
