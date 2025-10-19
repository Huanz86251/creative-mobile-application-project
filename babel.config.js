// babel.config.js  (for NativeWind v4)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
       
    ],
    plugins: [


      // 'react-native-reanimated/plugin',
    ],
  };
};
