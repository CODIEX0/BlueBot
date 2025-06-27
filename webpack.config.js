const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Customize the config before returning it.
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native-svg': path.resolve(__dirname, 'node_modules/react-native-svg'),
    'fbjs': path.resolve(__dirname, 'node_modules/fbjs'),
    'fbjs/lib/invariant': path.resolve(__dirname, 'node_modules/fbjs/lib/invariant.js'),
    'fbjs/lib/ExecutionEnvironment': path.resolve(__dirname, 'node_modules/fbjs/lib/ExecutionEnvironment.js'),
    // Ensure assets folder in react-navigation elements resolves
    '@react-navigation/elements/lib/module/assets': path.resolve(__dirname, 'node_modules/@react-navigation/elements/lib/module/assets'),
  };

  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
  };

  // Add webpack asset rule for react-navigation elements icons
  config.module.rules.unshift({
    test: /@react-navigation\/elements\/lib\/module\/assets\/.*\.(png|jpg|jpeg|gif|svg)$/,
    type: 'asset/resource',
    generator: {
      filename: 'static/media/[name][ext]',
    },
  });

  return config;
};
