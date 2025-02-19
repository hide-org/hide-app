import type IForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import * as path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin: typeof IForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
require('dotenv').config();

export const plugins = [
  new ForkTsCheckerWebpackPlugin({
    logger: 'webpack-infrastructure',
    issue: {
      exclude: [
        { file: '**/node_modules/**' }
      ]
    },
  }),
  new CopyWebpackPlugin({
    patterns: [
      {
        from: path.resolve(__dirname, 'public'),
        to: 'main_window'
      }
    ]
  }),
  new webpack.EnvironmentPlugin({
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY,
  }),
];
