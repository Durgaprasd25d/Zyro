const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * Fix: react-native/asset-registry resolution broken in RN 0.81.x
 * @type {import('metro-config').MetroConfig}
 */
const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    // Fix for RN 0.81 breaking asset-registry resolution in Expo OTA bundler
    extraNodeModules: {
      'react-native/asset-registry': path.resolve(
        __dirname,
        'node_modules/react-native/Libraries/Image/AssetRegistry'
      ),
    },
  },
};

module.exports = mergeConfig(defaultConfig, config);
