const { getDefaultConfig } = require('metro-config')
const path = require('path')

// react-native-tvos 使用与 react-native 相同的 metro 配置，仅需让 metro 解析 @ 别名。
module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig(__dirname)
  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      extraNodeModules: {
        '@': path.resolve(__dirname, 'src'),
      },
      sourceExts,
      assetExts,
    },
  }
})()
