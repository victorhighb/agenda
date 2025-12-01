// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Adicione a extensão 'cjs' para que o Metro possa resolver módulos CommonJS corretamente
config.resolver.sourceExts.push('cjs');

module.exports = config;