// metro.config.js
// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Shim Node.js built-in modules that some packages (e.g. @ide/backoff via
// expo-notifications) try to import. Metro bundles for React Native and has
// no stdlib — provide a tiny no-op shim so the bundle succeeds.
config.resolver = {
    ...config.resolver,
    extraNodeModules: {
        ...config.resolver?.extraNodeModules,
        assert: require.resolve('./shims/assert.js'),
    },
};

module.exports = config;
