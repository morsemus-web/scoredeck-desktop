// Metro config for Expo — enables package.exports so @supabase/supabase-js
// resolves its transitive @opentelemetry/api entry points correctly.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = true;

module.exports = config;
