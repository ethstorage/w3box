const webpack = require('webpack');

module.exports = {
  configureWebpack:{
    plugins: [
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    ],
    resolve: {
      fallback: {
        assert: require.resolve('assert/'),
        crypto: require.resolve('crypto-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        os: require.resolve('os-browserify/browser'),
        stream: require.resolve('stream-browserify'),
        url: require.resolve('url'),
        zlib: require.resolve('browserify-zlib'),
      }
    },
    optimization: {
      splitChunks: {
        minSize: 1024000,
        maxSize: 1024000,
      }
    }
  },
  productionSourceMap: false,
  publicPath: '/',
  runtimeCompiler: true,
};
