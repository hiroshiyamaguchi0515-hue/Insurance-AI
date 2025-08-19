module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Fix for webpack-dev-server allowedHosts issue
      if (env === 'development') {
        webpackConfig.devServer = {
          ...webpackConfig.devServer,
          allowedHosts: 'all',
          host: '127.0.0.1',
          port: 3000,
        };
      }
      return webpackConfig;
    },
  },
  devServer: {
    allowedHosts: 'all',
    host: '127.0.0.1',
    port: 3000,
  },
};
