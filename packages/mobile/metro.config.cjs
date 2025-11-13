// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Set the correct project root
config.projectRoot = projectRoot;

// Watch all files within the monorepo
config.watchFolders = [workspaceRoot];

// Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Add platform-specific extensions to source extensions
// This allows Metro to resolve .native.ts files for React Native
config.resolver.sourceExts = [
  'native.ts',
  'native.tsx',
  ...config.resolver.sourceExts
];

// Disable hierarchical module lookup to prevent resolving from workspace root
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
