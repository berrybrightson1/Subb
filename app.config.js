module.exports = ({ config }) => {
    // If we are building for web on Vercel, remove native-only plugins
    // that do not have web support and throw errors.
    if (process.env.VERCEL === '1') {
        if (config.plugins) {
            config.plugins = config.plugins.filter((plugin) => {
                const pluginName = Array.isArray(plugin) ? plugin[0] : plugin;
                return pluginName !== 'react-native-purchases';
            });
        }
    }

    return config;
};
