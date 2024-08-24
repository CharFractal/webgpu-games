const path = require('path');

module.exports = {
  entry: './index.ts',  // Your main TypeScript file
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.ts$/,  // Correct regex for TypeScript files
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'  // Uses ts-loader for TypeScript files
        }
      },
      {
        test: /\.wgsl$/,  // Correct regex for WGSL files
        use: 'raw-loader'  // Use raw-loader to load WGSL files as raw text
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.wgsl']  // Resolve TypeScript and WGSL files
  },
  mode: 'development'  // Change to 'production' for optimized builds
};

