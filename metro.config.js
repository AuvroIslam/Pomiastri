const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// @expo/metro-runtime ships TypeScript source but no compiled JS for its
// error-overlay directory. Metro can't auto-resolve .tsx directory indexes
// inside node_modules, so we manually point it to the correct native file.
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === './src/error-overlay' &&
    context.originModulePath.includes('@expo/metro-runtime')
  ) {
    return {
      filePath: path.resolve(
        __dirname,
        'node_modules/@expo/metro-runtime/src/error-overlay/index.native.tsx'
      ),
      type: 'sourceFile',
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
