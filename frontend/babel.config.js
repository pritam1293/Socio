module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', {
      targets: { node: 'current' },
    }]],
    plugins: [
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-private-property-in-object',
    ],
  };
};
