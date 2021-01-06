"use strict";
const webpack = require('webpack'), 
//WebpackNotifierPlugin = require( 'webpack-notifier' ),
HtmlWebpackPlugin = require('html-webpack-plugin'), path = require('path'), { CleanWebpackPlugin } = require('clean-webpack-plugin'), 
//   InterpolateHtmlPlugin = require( 'interpolate-html-plugin' ),
//   package_json          = require( './package.json' ),
develop = process.argv.indexOf('--env.develop') >= 0;
process.env.NODE_ENV = develop ? 'development' : 'production';
const dist = path.join(__dirname, process.env.WEBPACK_DIST || 'public'), 
//   paths                = require( './paths' ),
//      getClientEnvironment = require( './env' ),
//      publicPath           = paths.servedPath,
//      publicUrl            = publicPath.slice( 0, -1 ),
//      env                  = getClientEnvironment( publicUrl ),
plugins = [
    new webpack.ProvidePlugin({
        //   $        : 'jquery',
        //   jQuery   : 'jquery',
        //   jQueryUI : 'jquery-ui',
        _: 'lodash'
    })
];
/*
if( !develop && env.stringified[ 'process.env' ].NODE_ENV !== '"production"' ) {
    throw new Error( 'Production builds must have NODE_ENV=production.' );
}
*/
console.log((develop ? 'DEVELOP' : 'PRODUCTION') + ' build configuration.');
console.log('My dir name is', __dirname);
process.traceDeprecation = !develop;
plugins.push(new HtmlWebpackPlugin({
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
/*develop &&*/ plugins.push(new CleanWebpackPlugin());
let config = {
    mode: develop ? 'development' : 'production',
    entry: {
        app: './src/js/client/app.js'
    },
    output: {
        path: dist,
        publicPath: '/public',
        filename: 'build/app_[fullhash:5].js'
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
//# sourceMappingURL=webpack.config.js.map