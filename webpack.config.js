const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    background: './src/background/background.js',
    content: './src/content/content.js',
    popup: './src/popup/popup.js',
    options: './src/options/options.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'src/options/options.html', to: 'options.html' },
        { from: 'src/popup/popup.css', to: 'popup.css' },
        { from: 'src/options/options.css', to: 'options.css' },
        { from: 'assets', to: 'assets' },
        {
          from: 'manifest.json',
          to: 'manifest.json',
          transform(content) {
            // Update paths in the manifest file
            const manifest = JSON.parse(content.toString());
            
            // Update paths
            manifest.action.default_popup = 'popup.html';
            manifest.options_page = 'options.html';
            manifest.background.service_worker = 'background.js';
            
            // Remove module type
            delete manifest.background.type;
            
            // Update content scripts
            manifest.content_scripts = [
              {
                matches: ['<all_urls>'],
                js: ['content.js'],
                run_at: 'document_idle'
              }
            ];
            
            // Update CSP
            manifest.content_security_policy = {
              extension_pages: "script-src 'self'; object-src 'none'; frame-ancestors 'none'"
            };
            
            return JSON.stringify(manifest, null, 2);
          }
        }
      ]
    })
  ],
  resolve: {
    extensions: ['.js']
  }
};
