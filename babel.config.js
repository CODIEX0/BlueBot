/**
 * Babel Configuration for BlueBot
 * Supports Expo/React Native and TypeScript
 */

module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: [
      'babel-preset-expo',
      ['@babel/preset-typescript', { allowNamespaces: true }]
    ],
    plugins: [
      // Add any additional plugins here if needed
    ],
  };
};
