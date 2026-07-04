const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.getTransformOptions = () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
});

config.resolver.sourceExts.push('mjs');

module.exports = config;
