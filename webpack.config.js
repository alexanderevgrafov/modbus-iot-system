const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const Dotenv = require('dotenv-webpack');

develop = process.argv.indexOf('--mode=development') >= 0;

console.log(process.argv.join(' | '));

process.env.NODE_ENV = develop ? 'development' : 'production';

const dist = path.join(__dirname, process.env.WEBPACK_DIST || 'public'),


  plugins = [
    new webpack.ProvidePlugin({
      //   $        : 'jquery',
      //   jQuery   : 'jquery',
      //   jQueryUI : 'jquery-ui',
      _: 'lodash'
    }),
    new Dotenv(),
  ];
/*
if( !develop && env.stringified[ 'process.env' ].NODE_ENV !== '"production"' ) {
    throw new Error( 'Production builds must have NODE_ENV=production.' );
}
*/
console.log((develop ? 'DEVELOP' : 'PRODUCTION') + ' build configuration.');
console.log('My dir name is', __dirname);

process.traceDeprecation = !develop;

plugins.push(
  new HtmlWebpackPlugin({
    inject: true,
    filename: 'index.html',
    template: 'src/js/client/index.html',
    minify: !develop ? {
      removeComments: true,
      collapseWhitespace: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      removeEmptyAttributes: true,
      removeStyleLinkTypeAttributes: true,
      keepClosingSlash: true,
      minifyJS: true,
      minifyCSS: true,
      minifyURLs: true,
    } : {},
  }));

// plugins.push(
//     new InterpolateHtmlPlugin( env.raw )
// );

// plugins.push(
//     new webpack.DefinePlugin( env.stringified )
// );

//develop && plugins.push( new WebpackNotifierPlugin( { alwaysNotify : true } ) );
/*develop &&*/
plugins.push(new CleanWebpackPlugin());

let config = {
  mode: develop ? 'development' : 'production',

  entry: {
    app: './src/js/client/App.jsx'
  },

  output: {
    path: dist,
    publicPath: '/',
    filename: 'build/[name][fullhash:5].js'
  },

  devtool: develop && 'source-map',

  plugins: plugins,

  resolve: {
    modules: ['node_modules'],
    alias: {
      app: path.resolve(__dirname, 'src', 'js', 'app'),
      ui: path.resolve(__dirname, 'src', 'js', 'ui'),
      models: path.resolve(__dirname, 'src', 'js', 'models'),
      lib: path.resolve(__dirname, 'src', 'js', 'lib'),
      scss: path.resolve(__dirname, 'src', 'scss'),
      templates: path.resolve(__dirname, 'src', 'templates'),
      server: path.resolve(__dirname, 'src', 'server')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)?$/,
        exclude: /(node_modules)/,
        loader: 'ts-loader'
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
      /*
      {
          test   : /\.hbs$/,
          loader : 'handlebars-loader'
      },
      {
          test : /\.scss$/,
          use  : [
              'style-loader', // creates style nodes from JS strings
              'css-loader', // translates CSS into CommonJS
              'sass-loader' // compiles Sass to CSS
          ]
      },
      {
          test   : /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader : 'url-loader?limit=10000&minetype=application/font-woff'
      },
      {
          test   : /\.(jpg|png|ttf|eot|svg|otf)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader : 'file-loader?name=assets/[name].[hash:5].[ext]'
      }
      */
    ]
  }
};

config.optimization = {
  splitChunks: {
    cacheGroups: {
      vendors: {
        test: /[\\/]node_modules[\\/]/,
        chunks: 'all',
        maxSize: 300000,
        priority: 1
      }
    }
  }
};

module.exports = config;
