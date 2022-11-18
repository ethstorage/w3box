module.exports = {
  configureWebpack:{
    optimization: {
      splitChunks: {
        minSize: 1024000,
        maxSize: 1024000,
      }
    }
  },
  productionSourceMap: false,
  publicPath: '/w3box.w3q/',
  runtimeCompiler: true,
};
