import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
    issue: {
      exclude: [
        { file: '**/node_modules/**' }
      ]
    },
    devServer: false
  }),
  new webpack.EnvironmentPlugin(['ANTHROPIC_API_KEY']),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'public'),
        to: path.resolve(__dirname, '.webpack/renderer')
      }
    ]
  })
];
