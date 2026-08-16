module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // 支持路径别名 @/xxx
    ['module-resolver', { root: ['./src'], alias: { '@': './src' } }],
  ],
}
